import express from 'express';
import db from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  sendDisputeCreatedByAutomobEmail,
  sendDisputeCreatedByClientEmail,
  sendDisputeCreatedToAdminsEmail,
  sendDisputeResolvedEmail
} from '../services/disputeEmailService.js';
import { createNotification } from '../utils/notificationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Helper function for role authorization
const requireRole = (roles) => authorizeRoles(...roles);

// Configuration multer pour les preuves
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/disputes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'dispute-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Type de fichier non autorisé. Utilisez: JPEG, PNG, PDF, DOC, DOCX'));
  }
});

// ==================== ROUTES AUTOMOB ====================

// Créer un litige (Automob)
router.post('/automob/create', authenticateToken, requireRole(['automob']), upload.array('evidence', 5), async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { mission_id, dispute_type, title, description, disputed_amount } = req.body;

    // Vérifier que la mission existe et appartient à l'automob
    const [missions] = await connection.query(
      'SELECT * FROM missions WHERE id = ? AND assigned_automob_id = ?',
      [mission_id, req.user.id]
    );

    if (missions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Mission non trouvée ou non autorisée' });
    }

    const mission = missions[0];

    // Préparer les URLs des preuves
    const evidence = req.files ? req.files.map(file => `/uploads/disputes/${file.filename}`) : [];

    // Créer le litige
    const [result] = await connection.query(
      `INSERT INTO disputes (
        mission_id, created_by_user_id, created_by_role, 
        against_user_id, against_role, dispute_type, 
        title, description, disputed_amount, evidence
      ) VALUES (?, ?, 'automob', ?, 'client', ?, ?, ?, ?, ?)`,
      [
        mission_id,
        req.user.id,
        mission.client_id,
        dispute_type,
        title,
        description,
        disputed_amount || 0,
        JSON.stringify(evidence)
      ]
    );

    const disputeId = result.insertId;

    // Récupérer les infos pour les notifications et emails
    const [clientUser] = await connection.query('SELECT email FROM users WHERE id = ?', [mission.client_id]);
    const [automobUser] = await connection.query(
      'SELECT first_name, last_name FROM automob_profiles WHERE user_id = ?',
      [req.user.id]
    );
    const automobName = `${automobUser[0].first_name} ${automobUser[0].last_name}`;

    // Créer une notification pour le Client
    const io = req.app.get('io');
    await createNotification(
      mission.client_id,
      'Nouveau litige',
      `Un litige a été créé concernant la mission "${mission.title}"`,
      'warning',
      'mission',
      `/client/disputes/${disputeId}`,
      io
    );

    // Envoyer email au Client
    await sendDisputeCreatedByAutomobEmail(
      disputeId,
      automobName,
      clientUser[0].email,
      mission.title,
      title
    );

    // Créer une notification pour les admins
    const [admins] = await connection.query('SELECT id FROM users WHERE role = "admin"');
    for (const admin of admins) {
      await createNotification(
        admin.id,
        'Nouveau litige à traiter',
        `Un litige a été créé par un Automob concernant la mission "${mission.title}"`,
        'warning',
        'system',
        `/admin/disputes/${disputeId}`,
        io
      );
    }

    // Envoyer email aux admins
    await sendDisputeCreatedToAdminsEmail(
      disputeId,
      'automob',
      automobName,
      'client',
      mission.title,
      title
    );

    await connection.commit();

    res.status(201).json({
      message: 'Litige créé avec succès',
      disputeId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur création litige automob:', error);
    res.status(500).json({ error: 'Erreur lors de la création du litige' });
  } finally {
    connection.release();
  }
});

// Lister les litiges de l'automob
router.get('/automob/my-disputes', authenticateToken, requireRole(['automob']), async (req, res) => {
  try {
    const [disputes] = await db.query(
      `SELECT 
        d.*,
        m.title as mission_title,
        m.mission_name,
        m.work_time,
        m.billing_frequency,
        u_against.email as against_email,
        cp.company_name as client_company,
        admin.email as admin_email
      FROM disputes d
      JOIN missions m ON d.mission_id = m.id
      JOIN users u_against ON d.against_user_id = u_against.id
      LEFT JOIN client_profiles cp ON u_against.id = cp.user_id
      LEFT JOIN users admin ON d.admin_user_id = admin.id
      WHERE d.created_by_user_id = ? OR d.against_user_id = ?
      ORDER BY d.created_at DESC`,
      [req.user.id, req.user.id]
    );

    res.json(disputes);
  } catch (error) {
    console.error('Erreur récupération litiges automob:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des litiges' });
  }
});

// ==================== ROUTES CLIENT ====================

// Créer un litige (Client)
router.post('/client/create', authenticateToken, requireRole(['client']), upload.array('evidence', 5), async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { mission_id, dispute_type, title, description, disputed_amount } = req.body;

    // Vérifier que la mission existe et appartient au client
    const [missions] = await connection.query(
      'SELECT * FROM missions WHERE id = ? AND client_id = ?',
      [mission_id, req.user.id]
    );

    if (missions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Mission non trouvée ou non autorisée' });
    }

    const mission = missions[0];

    // Préparer les URLs des preuves
    const evidence = req.files ? req.files.map(file => `/uploads/disputes/${file.filename}`) : [];

    // Créer le litige
    const [result] = await connection.query(
      `INSERT INTO disputes (
        mission_id, created_by_user_id, created_by_role, 
        against_user_id, against_role, dispute_type, 
        title, description, disputed_amount, evidence
      ) VALUES (?, ?, 'client', ?, 'automob', ?, ?, ?, ?, ?)`,
      [
        mission_id,
        req.user.id,
        mission.assigned_automob_id,
        dispute_type,
        title,
        description,
        disputed_amount || 0,
        JSON.stringify(evidence)
      ]
    );

    const disputeId = result.insertId;

    // Récupérer les infos pour les notifications et emails
    const [automobUser] = await connection.query('SELECT email FROM users WHERE id = ?', [mission.assigned_automob_id]);
    const [clientProfile] = await connection.query(
      'SELECT company_name FROM client_profiles WHERE user_id = ?',
      [req.user.id]
    );
    const clientName = clientProfile[0].company_name;

    // Créer une notification pour l'Automob
    const io = req.app.get('io');
    await createNotification(
      mission.assigned_automob_id,
      'Nouveau litige',
      `Un litige a été créé concernant la mission "${mission.title}"`,
      'warning',
      'mission',
      `/automob/disputes/${disputeId}`,
      io
    );

    // Envoyer email à l'automob
    await sendDisputeCreatedByClientEmail(
      disputeId,
      clientName,
      automobUser[0].email,
      mission.title,
      title
    );

    // Créer une notification pour les admins
    const [admins] = await connection.query('SELECT id FROM users WHERE role = "admin"');
    for (const admin of admins) {
      await createNotification(
        admin.id,
        'Nouveau litige à traiter',
        `Un litige a été créé par un Client concernant la mission "${mission.title}"`,
        'warning',
        'system',
        `/admin/disputes/${disputeId}`,
        io
      );
    }

    // Envoyer email aux admins
    await sendDisputeCreatedToAdminsEmail(
      disputeId,
      'client',
      clientName,
      'automob',
      mission.title,
      title
    );

    await connection.commit();

    res.status(201).json({
      message: 'Litige créé avec succès',
      disputeId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur création litige client:', error);
    res.status(500).json({ error: 'Erreur lors de la création du litige' });
  } finally {
    connection.release();
  }
});

// Lister les litiges du client
router.get('/client/my-disputes', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const [disputes] = await db.query(
      `SELECT 
        d.*,
        m.title as mission_title,
        m.mission_name,
        m.work_time,
        m.billing_frequency,
        u_against.email as against_email,
        ap.first_name as automob_first_name,
        ap.last_name as automob_last_name,
        admin.email as admin_email
      FROM disputes d
      JOIN missions m ON d.mission_id = m.id
      JOIN users u_against ON d.against_user_id = u_against.id
      LEFT JOIN automob_profiles ap ON u_against.id = ap.user_id
      LEFT JOIN users admin ON d.admin_user_id = admin.id
      WHERE d.created_by_user_id = ? OR d.against_user_id = ?
      ORDER BY d.created_at DESC`,
      [req.user.id, req.user.id]
    );

    res.json(disputes);
  } catch (error) {
    console.error('Erreur récupération litiges client:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des litiges' });
  }
});

// ==================== ROUTES ADMIN ====================

// Lister tous les litiges (Admin)
router.get('/admin/all', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        d.*,
        m.title as mission_title,
        m.mission_name,
        m.work_time,
        m.billing_frequency,
        m.budget as mission_price,
        u_creator.email as creator_email,
        u_against.email as against_email,
        CASE 
          WHEN d.created_by_role = 'automob' THEN CONCAT(ap_creator.first_name, ' ', ap_creator.last_name)
          ELSE cp_creator.company_name
        END as creator_name,
        CASE 
          WHEN d.against_role = 'automob' THEN CONCAT(ap_against.first_name, ' ', ap_against.last_name)
          ELSE cp_against.company_name
        END as against_name,
        admin.email as admin_email
      FROM disputes d
      JOIN missions m ON d.mission_id = m.id
      JOIN users u_creator ON d.created_by_user_id = u_creator.id
      JOIN users u_against ON d.against_user_id = u_against.id
      LEFT JOIN automob_profiles ap_creator ON u_creator.id = ap_creator.user_id
      LEFT JOIN client_profiles cp_creator ON u_creator.id = cp_creator.user_id
      LEFT JOIN automob_profiles ap_against ON u_against.id = ap_against.user_id
      LEFT JOIN client_profiles cp_against ON u_against.id = cp_against.user_id
      LEFT JOIN users admin ON d.admin_user_id = admin.id
    `;

    const params = [];

    if (status) {
      query += ' WHERE d.status = ?';
      params.push(status);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [disputes] = await db.query(query, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM disputes';
    if (status) {
      countQuery += ' WHERE status = ?';
    }
    const [countResult] = await db.query(countQuery, status ? [status] : []);

    res.json({
      disputes,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération litiges admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des litiges' });
  }
});

// Obtenir les détails d'un litige (Admin)
router.get('/admin/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [disputes] = await db.query(
      `SELECT 
        d.*,
        m.title as mission_title,
        m.description as mission_description,
        m.mission_name,
        m.work_time,
        m.billing_frequency,
        m.budget as mission_price,
        m.status as mission_status,
        u_creator.email as creator_email,
        u_against.email as against_email,
        CASE 
          WHEN d.created_by_role = 'automob' THEN CONCAT(ap_creator.first_name, ' ', ap_creator.last_name)
          ELSE cp_creator.company_name
        END as creator_name,
        CASE 
          WHEN d.against_role = 'automob' THEN CONCAT(ap_against.first_name, ' ', ap_against.last_name)
          ELSE cp_against.company_name
        END as against_name,
        admin.email as admin_email
      FROM disputes d
      JOIN missions m ON d.mission_id = m.id
      JOIN users u_creator ON d.created_by_user_id = u_creator.id
      JOIN users u_against ON d.against_user_id = u_against.id
      LEFT JOIN automob_profiles ap_creator ON u_creator.id = ap_creator.user_id
      LEFT JOIN client_profiles cp_creator ON u_creator.id = cp_creator.user_id
      LEFT JOIN automob_profiles ap_against ON u_against.id = ap_against.user_id
      LEFT JOIN client_profiles cp_against ON u_against.id = cp_against.user_id
      LEFT JOIN users admin ON d.admin_user_id = admin.id
      WHERE d.id = ?`,
      [req.params.id]
    );

    if (disputes.length === 0) {
      return res.status(404).json({ error: 'Litige non trouvé' });
    }

    // Récupérer les messages du litige
    const [messages] = await db.query(
      `SELECT 
        dm.*,
        u.email,
        CASE 
          WHEN dm.user_role = 'automob' THEN CONCAT(ap.first_name, ' ', ap.last_name)
          WHEN dm.user_role = 'client' THEN cp.company_name
          ELSE 'Admin'
        END as user_name
      FROM dispute_messages dm
      JOIN users u ON dm.user_id = u.id
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE dm.dispute_id = ?
      ORDER BY dm.created_at ASC`,
      [req.params.id]
    );

    res.json({
      dispute: disputes[0],
      messages
    });
  } catch (error) {
    console.error('Erreur récupération détails litige:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du litige' });
  }
});

// Résoudre un litige (Admin)
router.post('/admin/:id/resolve', authenticateToken, requireRole(['admin']), async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { admin_decision, admin_notes, compensation_amount, compensation_to } = req.body;
    const disputeId = req.params.id;

    // Récupérer le litige
    const [disputes] = await connection.query('SELECT * FROM disputes WHERE id = ?', [disputeId]);

    if (disputes.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Litige non trouvé' });
    }

    const dispute = disputes[0];

    // Déterminer qui reçoit la compensation
    let compensationToUserId = null;
    if (compensation_to === 'automob') {
      compensationToUserId = dispute.created_by_role === 'automob' ? dispute.created_by_user_id : dispute.against_user_id;
    } else if (compensation_to === 'client') {
      compensationToUserId = dispute.created_by_role === 'client' ? dispute.created_by_user_id : dispute.against_user_id;
    }

    // Mettre à jour le litige
    await connection.query(
      `UPDATE disputes 
       SET status = 'resolved', 
           admin_decision = ?, 
           admin_notes = ?, 
           admin_user_id = ?,
           compensation_amount = ?,
           compensation_to_user_id = ?,
           decided_at = NOW()
       WHERE id = ?`,
      [admin_decision, admin_notes, req.user.id, compensation_amount || 0, compensationToUserId, disputeId]
    );

    // Si compensation, ajouter au wallet de l'automob
    if (compensation_amount > 0 && compensationToUserId) {
      const [user] = await connection.query('SELECT role FROM users WHERE id = ?', [compensationToUserId]);

      if (user[0].role === 'automob') {
        // Récupérer le wallet de l'automob
        const [walletData] = await connection.query(
          'SELECT id, balance FROM wallets WHERE automob_id = ?',
          [compensationToUserId]
        );

        if (!walletData || walletData.length === 0) {
          throw new Error('Wallet automob non trouvé');
        }

        const wallet = walletData[0];
        const oldBalance = parseFloat(wallet.balance);
        const newBalance = oldBalance + parseFloat(compensation_amount);

        // Ajouter au wallet
        await connection.query(
          `INSERT INTO wallet_transactions 
           (wallet_id, automob_id, type, amount, balance_before, balance_after, description, created_by)
           VALUES (?, ?, 'adjustment', ?, ?, ?, ?, ?)`,
          [wallet.id, compensationToUserId, compensation_amount, oldBalance, newBalance, `Compensation pour litige #${disputeId}`, req.user.id]
        );

        // Mettre à jour le solde
        await connection.query(
          'UPDATE wallets SET balance = ?, updated_at = NOW() WHERE automob_id = ?',
          [newBalance, compensationToUserId]
        );

        // Marquer la compensation comme payée
        await connection.query(
          'UPDATE disputes SET compensation_paid = TRUE WHERE id = ?',
          [disputeId]
        );
      }
    }

    // Enregistrer dans l'historique
    await connection.query(
      `INSERT INTO dispute_history (dispute_id, admin_user_id, action, details)
       VALUES (?, ?, 'resolved', ?)`,
      [disputeId, req.user.id, JSON.stringify({ admin_decision, compensation_amount })]
    );

    // Récupérer les infos des parties pour les emails
    const [creatorUser] = await connection.query(
      `SELECT u.email, u.role,
        CASE 
          WHEN u.role = 'automob' THEN CONCAT(ap.first_name, ' ', ap.last_name)
          ELSE cp.company_name
        END as name
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE u.id = ?`,
      [dispute.created_by_user_id]
    );

    const [againstUser] = await connection.query(
      `SELECT u.email, u.role,
        CASE 
          WHEN u.role = 'automob' THEN CONCAT(ap.first_name, ' ', ap.last_name)
          ELSE cp.company_name
        END as name
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE u.id = ?`,
      [dispute.against_user_id]
    );

    const [missionInfo] = await connection.query('SELECT title FROM missions WHERE id = ?', [dispute.mission_id]);

    // Notifier les parties
    const winner = admin_decision === 'automob_wins' ? 'automob' : admin_decision === 'client_wins' ? 'client' : 'partial';

    // Déterminer qui a gagné
    const creatorIsWinner =
      (admin_decision === 'automob_wins' && dispute.created_by_role === 'automob') ||
      (admin_decision === 'client_wins' && dispute.created_by_role === 'client');

    const againstIsWinner =
      (admin_decision === 'automob_wins' && dispute.against_role === 'automob') ||
      (admin_decision === 'client_wins' && dispute.against_role === 'client');

    // Notification créateur
    const io = req.app.get('io');
    await createNotification(
      dispute.created_by_user_id,
      'Litige résolu',
      `Le litige #${disputeId} a été résolu. Décision: ${winner}`,
      'success',
      'mission',
      `/${dispute.created_by_role}/disputes/${disputeId}`,
      io
    );

    // Email créateur
    await sendDisputeResolvedEmail(
      creatorUser[0].email,
      creatorUser[0].name,
      disputeId,
      missionInfo[0].title,
      admin_decision,
      admin_notes,
      creatorIsWinner && compensationToUserId === dispute.created_by_user_id ? parseFloat(compensation_amount) : 0,
      creatorIsWinner
    );

    // Notification partie adverse
    await createNotification(
      dispute.against_user_id,
      'Litige résolu',
      `Le litige #${disputeId} a été résolu. Décision: ${winner}`,
      'success',
      'mission',
      `/${dispute.against_role}/disputes/${disputeId}`,
      io
    );

    // Email partie adverse
    await sendDisputeResolvedEmail(
      againstUser[0].email,
      againstUser[0].name,
      disputeId,
      missionInfo[0].title,
      admin_decision,
      admin_notes,
      againstIsWinner && compensationToUserId === dispute.against_user_id ? parseFloat(compensation_amount) : 0,
      againstIsWinner
    );

    await connection.commit();

    res.json({ message: 'Litige résolu avec succès' });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur résolution litige:', error);
    res.status(500).json({ error: 'Erreur lors de la résolution du litige' });
  } finally {
    connection.release();
  }
});

// Obtenir les détails d'un litige (Client / Automob)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const disputeId = req.params.id;

    // Vérifier que l'utilisateur a accès à ce litige
    const [disputes] = await db.query(
      `SELECT 
        d.*,
        m.title as mission_title,
        m.description as mission_description,
        m.mission_name,
        m.work_time,
        m.billing_frequency,
        m.budget as mission_price,
        m.status as mission_status,
        u_creator.email as creator_email,
        u_against.email as against_email,
        CASE 
          WHEN d.created_by_role = 'automob' THEN CONCAT(ap_creator.first_name, ' ', ap_creator.last_name)
          ELSE cp_creator.company_name
        END as creator_name,
        CASE 
          WHEN d.against_role = 'automob' THEN CONCAT(ap_against.first_name, ' ', ap_against.last_name)
          ELSE cp_against.company_name
        END as against_name,
        admin.email as admin_email
      FROM disputes d
      JOIN missions m ON d.mission_id = m.id
      JOIN users u_creator ON d.created_by_user_id = u_creator.id
      JOIN users u_against ON d.against_user_id = u_against.id
      LEFT JOIN automob_profiles ap_creator ON u_creator.id = ap_creator.user_id
      LEFT JOIN client_profiles cp_creator ON u_creator.id = cp_creator.user_id
      LEFT JOIN automob_profiles ap_against ON u_against.id = ap_against.user_id
      LEFT JOIN client_profiles cp_against ON u_against.id = cp_against.user_id
      LEFT JOIN users admin ON d.admin_user_id = admin.id
      WHERE d.id = ? AND (d.created_by_user_id = ? OR d.against_user_id = ? OR ? IN (SELECT id FROM users WHERE role = 'admin'))`,
      [disputeId, req.user.id, req.user.id, req.user.id]
    );

    if (disputes.length === 0) {
      return res.status(404).json({ error: 'Litige non trouvé ou accès refusé' });
    }

    // Récupérer les messages du litige
    const [messages] = await db.query(
      `SELECT 
        dm.*,
        u.email,
        CASE 
          WHEN dm.user_role = 'automob' THEN CONCAT(ap.first_name, ' ', ap.last_name)
          WHEN dm.user_role = 'client' THEN cp.company_name
          ELSE 'Admin'
        END as user_name
      FROM dispute_messages dm
      JOIN users u ON dm.user_id = u.id
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE dm.dispute_id = ?
      ORDER BY dm.created_at ASC`,
      [disputeId]
    );

    res.json({
      dispute: disputes[0],
      messages
    });
  } catch (error) {
    console.error('Erreur récupération détails litige client/automob:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du litige' });
  }
});

router.post('/:id/message', authenticateToken, upload.array('attachments', 3), async (req, res) => {
  try {
    const { message } = req.body;
    const disputeId = req.params.id;

    // Vérifier que l'utilisateur a accès à ce litige
    const [disputes] = await db.query(
      `SELECT * FROM disputes 
       WHERE id = ? AND (created_by_user_id = ? OR against_user_id = ? OR ? IN (SELECT id FROM users WHERE role = 'admin'))`,
      [disputeId, req.user.id, req.user.id, req.user.id]
    );

    if (disputes.length === 0) {
      return res.status(404).json({ error: 'Litige non trouvé ou accès refusé' });
    }

    const attachments = req.files ? req.files.map(file => `/uploads/disputes/${file.filename}`) : [];

    await db.query(
      `INSERT INTO dispute_messages (dispute_id, user_id, user_role, message, attachments)
       VALUES (?, ?, ?, ?, ?)`,
      [disputeId, req.user.id, req.user.role, message, JSON.stringify(attachments)]
    );

    res.json({ message: 'Message ajouté avec succès' });
  } catch (error) {
    console.error('Erreur ajout message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du message' });
  }
});

export default router;

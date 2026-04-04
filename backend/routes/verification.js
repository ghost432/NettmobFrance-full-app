import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendVerificationStatusEmail } from '../services/emailService.js';
import { NotificationTemplates } from '../utils/notificationHelper.js';

const router = express.Router();

// Créer le dossier uploads/verification
const uploadDir = 'uploads/verification';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const fileName = `${req.user.id}_${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images (JPEG, JPG, PNG) sont autorisées'));
    }
  }
});

// Soumettre une demande de vérification d'identité
router.post('/submit', authenticateToken, upload.single('idDocument'), async (req, res) => {
  console.log('📋 Soumission vérification identité:', req.user.id);

  if (!req.file) {
    return res.status(400).json({ error: 'Document d\'identité requis' });
  }

  try {
    const documentPath = `/${req.file.path.replace(/\\/g, '/')}`;
    const { documentType, documentNumber } = req.body;

    // Créer ou mettre à jour la demande de vérification
    const [existing] = await db.query(
      'SELECT id FROM identity_verifications WHERE user_id = ?',
      [req.user.id]
    );

    if (existing.length > 0) {
      // Mettre à jour
      await db.query(
        `UPDATE identity_verifications 
         SET document_path = ?, document_type = ?, document_number = ?, 
             status = 'pending', submitted_at = NOW(), reviewed_at = NULL, 
             reviewed_by = NULL, rejection_reason = NULL
         WHERE user_id = ?`,
        [documentPath, documentType, documentNumber, req.user.id]
      );
    } else {
      // Créer
      await db.query(
        `INSERT INTO identity_verifications 
         (user_id, document_path, document_type, document_number, status, submitted_at) 
         VALUES (?, ?, ?, ?, 'pending', NOW())`,
        [req.user.id, documentPath, documentType, documentNumber]
      );
    }

    // Mettre à jour le statut dans le profil
    const table = req.user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
    await db.query(
      `UPDATE ${table} SET id_verified = 0 WHERE user_id = ?`,
      [req.user.id]
    );

    console.log('✅ Vérification soumise avec succès');
    res.json({ message: 'Demande de vérification soumise avec succès' });
  } catch (error) {
    console.error('Erreur soumission vérification:', error);
    res.status(500).json({ error: 'Erreur lors de la soumission' });
  }
});

// Récupérer le statut de vérification de l'utilisateur
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const [verifications] = await db.query(
      `SELECT id, document_type, status, submitted_at, reviewed_at, rejection_reason
       FROM identity_verifications
       WHERE user_id = ?
       ORDER BY submitted_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (verifications.length === 0) {
      return res.json({ status: 'not_submitted' });
    }

    res.json(verifications[0]);
  } catch (error) {
    console.error('Erreur récupération statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Récupérer toutes les demandes en attente
router.get('/pending', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    const [verifications] = await db.query(
      `SELECT 
        iv.id, iv.user_id, iv.document_path, iv.document_type, iv.document_number,
        iv.status, iv.submitted_at, iv.reviewed_at, iv.rejection_reason,
        u.email, u.role,
        CASE 
          WHEN u.role = 'automob' THEN CONCAT(ap.first_name, ' ', ap.last_name)
          WHEN u.role = 'client' THEN CONCAT(cp.first_name, ' ', cp.last_name, ' - ', cp.company_name)
        END as full_name
       FROM identity_verifications iv
       JOIN users u ON iv.user_id = u.id
       LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
       LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
       WHERE iv.status = 'pending'
       ORDER BY iv.submitted_at ASC`
    );

    res.json(verifications);
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Récupérer toutes les demandes (avec filtre)
router.get('/all', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    const { status } = req.query;
    let whereClause = '';
    const params = [];

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereClause = 'WHERE iv.status = ?';
      params.push(status);
    }

    const [verifications] = await db.query(
      `SELECT 
        iv.id, iv.user_id, iv.document_path, iv.document_type, iv.document_number,
        iv.status, iv.submitted_at, iv.reviewed_at, iv.rejection_reason,
        u.email, u.role,
        CASE 
          WHEN u.role = 'automob' THEN CONCAT(ap.first_name, ' ', ap.last_name)
          WHEN u.role = 'client' THEN CONCAT(cp.first_name, ' ', cp.last_name, ' - ', cp.company_name)
        END as full_name
       FROM identity_verifications iv
       JOIN users u ON iv.user_id = u.id
       LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
       LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
       ${whereClause}
       ORDER BY iv.submitted_at DESC`,
      params
    );

    res.json(verifications);
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Approuver une vérification
router.put('/:id/approve', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { id } = req.params;

  try {
    // Récupérer les infos de la vérification
    const [[verification]] = await db.query(
      'SELECT user_id FROM identity_verifications WHERE id = ?',
      [id]
    );

    if (!verification) {
      return res.status(404).json({ error: 'Vérification non trouvée' });
    }

    // Mettre à jour la vérification
    await db.query(
      `UPDATE identity_verifications 
       SET status = 'approved', reviewed_at = NOW(), reviewed_by = ?
       WHERE id = ?`,
      [req.user.id, id]
    );

    // Récupérer le rôle de l'utilisateur
    const [[user]] = await db.query('SELECT email, role FROM users WHERE id = ?', [verification.user_id]);

    // Mettre à jour le profil
    const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
    await db.query(
      `UPDATE ${table} SET id_verified = 1 WHERE user_id = ?`,
      [verification.user_id]
    );

    // Envoyer un email de confirmation
    await sendVerificationStatusEmail(user.email, 'approved');

    // Créer une notification
    const io = req.app.get('io');
    await NotificationTemplates.identityApproved(verification.user_id, io);

    console.log('✅ Vérification approuvée pour user:', verification.user_id);
    res.json({ message: 'Vérification approuvée' });
  } catch (error) {
    console.error('Erreur approbation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Rejeter une vérification
router.put('/:id/reject', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Raison du rejet requise' });
  }

  try {
    // Récupérer les infos de la vérification
    const [[verification]] = await db.query(
      'SELECT user_id FROM identity_verifications WHERE id = ?',
      [id]
    );

    if (!verification) {
      return res.status(404).json({ error: 'Vérification non trouvée' });
    }

    // Mettre à jour la vérification
    await db.query(
      `UPDATE identity_verifications 
       SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [req.user.id, reason, id]
    );

    // Récupérer l'email de l'utilisateur
    const [[user]] = await db.query('SELECT email, role FROM users WHERE id = ?', [verification.user_id]);

    // Mettre à jour le profil
    const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
    await db.query(
      `UPDATE ${table} SET id_verified = 0 WHERE user_id = ?`,
      [verification.user_id]
    );

    // Envoyer un email de rejet
    await sendVerificationStatusEmail(user.email, 'rejected', reason);

    // Créer une notification
    const io = req.app.get('io');
    await NotificationTemplates.identityRejected(verification.user_id, reason, io);

    console.log('❌ Vérification rejetée pour user:', verification.user_id);
    res.json({ message: 'Vérification rejetée' });
  } catch (error) {
    console.error('Erreur rejet:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Révoquer une vérification approuvée
router.put('/:id/revoke', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Raison de la révocation requise' });
  }

  try {
    // Récupérer les infos de la vérification
    const [[verification]] = await db.query(
      'SELECT user_id, status FROM identity_verifications WHERE id = ?',
      [id]
    );

    if (!verification) {
      return res.status(404).json({ error: 'Vérification non trouvée' });
    }

    if (verification.status !== 'approved') {
      return res.status(400).json({ error: 'Seules les vérifications approuvées peuvent être révoquées' });
    }

    // Mettre à jour la vérification
    await db.query(
      `UPDATE identity_verifications 
       SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [req.user.id, `[RÉVOQUÉ] ${reason}`, id]
    );

    // Récupérer l'utilisateur
    const [[user]] = await db.query('SELECT email, role FROM users WHERE id = ?', [verification.user_id]);

    // Mettre à jour le profil
    const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
    await db.query(
      `UPDATE ${table} SET id_verified = 0 WHERE user_id = ?`,
      [verification.user_id]
    );

    // Envoyer un email
    await sendVerificationStatusEmail(user.email, 'rejected', `Révocation: ${reason}`);

    // Créer une notification
    const io = req.app.get('io');
    await NotificationTemplates.identityRejected(verification.user_id, `Révocation: ${reason}`, io);

    console.log('🔒 Vérification révoquée pour user:', verification.user_id);
    res.json({ message: 'Vérification révoquée' });
  } catch (error) {
    console.error('Erreur révocation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

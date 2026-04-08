import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  sendVerificationSubmittedEmail,
  sendAdminNotificationEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendRevocationEmail
} from '../services/verificationEmailService.js';
import { createNotification } from '../utils/notificationHelper.js';

const router = express.Router();

// Helper pour vérifier l'existence d'une colonne
const columnExists = async (table, column) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  return rows[0].cnt > 0;
};

// Créer les dossiers uploads
const uploadDir = 'uploads/verification';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const fileName = `${req.user.id}_${Date.now()}_${file.fieldname}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images (JPEG, JPG, PNG) et PDF sont autorisés'));
    }
  }
});

// Configuration des champs pour automob
const automobFields = [
  { name: 'document_recto', maxCount: 1 },
  { name: 'document_verso', maxCount: 1 },
  { name: 'selfie_with_document', maxCount: 1 },
  { name: 'assurance_rc', maxCount: 1 },
  { name: 'justificatif_domicile', maxCount: 1 },
  { name: 'avis_insee', maxCount: 1 },
  { name: 'attestation_urssaf', maxCount: 1 },
  { name: 'habilitation_0', maxCount: 1 },
  { name: 'habilitation_1', maxCount: 1 },
  { name: 'habilitation_2', maxCount: 1 },
  { name: 'habilitation_3', maxCount: 1 },
  { name: 'habilitation_4', maxCount: 1 },
  { name: 'caces_0', maxCount: 1 },
  { name: 'caces_1', maxCount: 1 },
  { name: 'caces_2', maxCount: 1 },
  { name: 'caces_3', maxCount: 1 },
  { name: 'caces_4', maxCount: 1 }
];

// Configuration des champs pour client
const clientFields = [
  { name: 'document_recto', maxCount: 1 },
  { name: 'document_verso', maxCount: 1 },
  { name: 'selfie_with_document', maxCount: 1 },
  { name: 'kbis', maxCount: 1 },
  { name: 'justificatif_domicile', maxCount: 1 }
];

// Soumettre une demande de vérification - AUTOMOB
router.post('/automob/submit', authenticateToken, upload.fields(automobFields), async (req, res) => {
  console.log('📋 Soumission vérification automob:', req.user.id);

  try {
    const {
      first_name, last_name, email, phone, address,
      document_type, has_habilitations, nombre_habilitations,
      has_caces, nombre_caces, presentation
    } = req.body;

    // Construire les chemins des fichiers
    const files = req.files || {};
    const filePaths = {};
    
    Object.keys(files).forEach(fieldName => {
      if (files[fieldName] && files[fieldName][0]) {
        filePaths[fieldName] = `/${files[fieldName][0].path.replace(/\\/g, '/')}`;
      }
    });

    // Construire les tableaux pour habilitations et caces
    const habilitations = [];
    const caces = [];
    
    for (let i = 0; i < 5; i++) {
      if (filePaths[`habilitation_${i}`]) {
        habilitations.push(filePaths[`habilitation_${i}`]);
      }
      if (filePaths[`caces_${i}`]) {
        caces.push(filePaths[`caces_${i}`]);
      }
    }

    // Vérifier si une demande existe déjà
    const [existing] = await db.query(
      'SELECT id FROM identity_verifications_new WHERE user_id = ?',
      [req.user.id]
    );

    const data = {
      user_id: req.user.id,
      user_type: 'automob',
      first_name,
      last_name,
      email,
      phone,
      address,
      document_type,
      document_recto: filePaths.document_recto || null,
      document_verso: filePaths.document_verso || null,
      selfie_with_document: filePaths.selfie_with_document || null,
      assurance_rc: filePaths.assurance_rc || null,
      justificatif_domicile: filePaths.justificatif_domicile || null,
      avis_insee: filePaths.avis_insee || null,
      attestation_urssaf: filePaths.attestation_urssaf || null,
      has_habilitations: has_habilitations === 'oui' ? 1 : 0,
      nombre_habilitations: parseInt(nombre_habilitations) || 0,
      habilitations_files: JSON.stringify(habilitations),
      has_caces: has_caces === 'oui' ? 1 : 0,
      nombre_caces: parseInt(nombre_caces) || 0,
      caces_files: JSON.stringify(caces),
      presentation,
      status: 'pending',
      submitted_at: new Date()
    };

    if (existing.length > 0) {
      // Mettre à jour
      await db.query(
        `UPDATE identity_verifications_new 
         SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?,
             document_type = ?, document_recto = ?, document_verso = ?,
             selfie_with_document = ?, assurance_rc = ?, justificatif_domicile = ?,
             avis_insee = ?, attestation_urssaf = ?, has_habilitations = ?,
             nombre_habilitations = ?, habilitations_files = ?, has_caces = ?,
             nombre_caces = ?, caces_files = ?, presentation = ?,
             status = 'pending', submitted_at = NOW(), reviewed_at = NULL,
             reviewed_by = NULL, rejection_reason = NULL
         WHERE user_id = ?`,
        [
          data.first_name, data.last_name, data.email, data.phone, data.address,
          data.document_type, data.document_recto, data.document_verso,
          data.selfie_with_document, data.assurance_rc, data.justificatif_domicile,
          data.avis_insee, data.attestation_urssaf, data.has_habilitations,
          data.nombre_habilitations, data.habilitations_files, data.has_caces,
          data.nombre_caces, data.caces_files, data.presentation,
          req.user.id
        ]
      );
    } else {
      // Créer
      await db.query(
        `INSERT INTO identity_verifications_new 
         (user_id, user_type, first_name, last_name, email, phone, address,
          document_type, document_recto, document_verso, selfie_with_document,
          assurance_rc, justificatif_domicile, avis_insee, attestation_urssaf,
          has_habilitations, nombre_habilitations, habilitations_files,
          has_caces, nombre_caces, caces_files, presentation, status, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          data.user_id, data.user_type, data.first_name, data.last_name, data.email,
          data.phone, data.address, data.document_type, data.document_recto,
          data.document_verso, data.selfie_with_document, data.assurance_rc,
          data.justificatif_domicile, data.avis_insee, data.attestation_urssaf,
          data.has_habilitations, data.nombre_habilitations, data.habilitations_files,
          data.has_caces, data.nombre_caces, data.caces_files, data.presentation
        ]
      );
    }

    console.log('✅ Vérification automob soumise avec succès');
    
    // Envoyer emails
    try { await sendVerificationSubmittedEmail(email, `${first_name} ${last_name}`, 'automob'); } catch (e) { console.error('Erreur email soumission (automob):', e.message); }
    try { await sendAdminNotificationEmail(`${first_name} ${last_name}`, email, 'automob'); } catch (e) { console.error('Erreur email admin (automob):', e.message); }
    
    // Notifier l'utilisateur
    const io = req.app.get('io');
    await createNotification(
      req.user.id,
      '⏳ Demande en cours de traitement',
      'Votre demande de vérification d\'identité a été soumise avec succès. Nos équipes l\'examineront sous 24-48 heures.',
      'info',
      'verification',
      '/automob/verify-identity',
      io
    );
    
    // Notifier tous les admins
    const [admins] = await db.query('SELECT id FROM users WHERE role = "admin"');
    for (const admin of admins) {
      await createNotification(
        admin.id,
        '📋 Nouvelle demande de vérification',
        `${first_name} ${last_name} (Automob) a soumis une demande de vérification d'identité`,
        'warning',
        'verification',
        '/admin/verifications-new',
        io
      );
    }
    
    res.json({ message: 'Demande de vérification soumise avec succès' });
  } catch (error) {
    console.error('Erreur soumission vérification automob:', error);
    res.status(500).json({ error: 'Erreur lors de la soumission' });
  }
});

// Soumettre une demande de vérification - CLIENT
router.post('/client/submit', authenticateToken, upload.fields(clientFields), async (req, res) => {
  console.log('📋 Soumission vérification client:', req.user.id);

  try {
    const {
      manager_first_name, manager_last_name, manager_email, manager_phone,
      manager_address, manager_position, document_type, presentation
    } = req.body;

    // Construire les chemins des fichiers
    const files = req.files || {};
    const filePaths = {};
    
    Object.keys(files).forEach(fieldName => {
      if (files[fieldName] && files[fieldName][0]) {
        filePaths[fieldName] = `/${files[fieldName][0].path.replace(/\\/g, '/')}`;
      }
    });

    // Vérifier si une demande existe déjà
    const [existing] = await db.query(
      'SELECT id FROM identity_verifications_new WHERE user_id = ?',
      [req.user.id]
    );

    const data = {
      user_id: req.user.id,
      user_type: 'client',
      manager_first_name,
      manager_last_name,
      manager_email,
      manager_phone,
      manager_address,
      manager_position,
      document_type,
      document_recto: filePaths.document_recto || null,
      document_verso: filePaths.document_verso || null,
      selfie_with_document: filePaths.selfie_with_document || null,
      kbis: filePaths.kbis || null,
      justificatif_domicile: filePaths.justificatif_domicile || null,
      presentation,
      status: 'pending',
      submitted_at: new Date()
    };

    if (existing.length > 0) {
      // Mettre à jour
      await db.query(
        `UPDATE identity_verifications_new 
         SET manager_first_name = ?, manager_last_name = ?, manager_email = ?,
             manager_phone = ?, manager_address = ?, manager_position = ?,
             document_type = ?, document_recto = ?, document_verso = ?,
             selfie_with_document = ?, kbis = ?, justificatif_domicile = ?,
             presentation = ?, status = 'pending', submitted_at = NOW(),
             reviewed_at = NULL, reviewed_by = NULL, rejection_reason = NULL
         WHERE user_id = ?`,
        [
          data.manager_first_name, data.manager_last_name, data.manager_email,
          data.manager_phone, data.manager_address, data.manager_position,
          data.document_type, data.document_recto, data.document_verso,
          data.selfie_with_document, data.kbis, data.justificatif_domicile,
          data.presentation, req.user.id
        ]
      );
    } else {
      // Créer
      await db.query(
        `INSERT INTO identity_verifications_new 
         (user_id, user_type, manager_first_name, manager_last_name, manager_email,
          manager_phone, manager_address, manager_position, document_type,
          document_recto, document_verso, selfie_with_document, kbis,
          justificatif_domicile, presentation, status, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          data.user_id, data.user_type, data.manager_first_name, data.manager_last_name,
          data.manager_email, data.manager_phone, data.manager_address,
          data.manager_position, data.document_type, data.document_recto,
          data.document_verso, data.selfie_with_document, data.kbis,
          data.justificatif_domicile, data.presentation
        ]
      );
    }

    console.log('✅ Vérification client soumise avec succès');
    
    // Envoyer emails
    try { await sendVerificationSubmittedEmail(manager_email, `${manager_first_name} ${manager_last_name}`, 'client'); } catch (e) { console.error('Erreur email soumission (client):', e.message); }
    try { await sendAdminNotificationEmail(`${manager_first_name} ${manager_last_name}`, manager_email, 'client'); } catch (e) { console.error('Erreur email admin (client):', e.message); }
    
    // Notifier l'utilisateur
    const io = req.app.get('io');
    await createNotification(
      req.user.id,
      '⏳ Demande en cours de traitement',
      'Votre demande de vérification d\'identité a été soumise avec succès. Nos équipes l\'examineront sous 24-48 heures.',
      'info',
      'verification',
      '/client/verify-identity',
      io
    );
    
    // Notifier tous les admins
    const [admins] = await db.query('SELECT id FROM users WHERE role = "admin"');
    for (const admin of admins) {
      await createNotification(
        admin.id,
        '📋 Nouvelle demande de vérification',
        `${manager_first_name} ${manager_last_name} (Client) a soumis une demande de vérification d'identité`,
        'warning',
        'verification',
        '/admin/verifications-new',
        io
      );
    }
    
    res.json({ message: 'Demande de vérification soumise avec succès' });
  } catch (error) {
    console.error('Erreur soumission vérification client:', error);
    res.status(500).json({ error: 'Erreur lors de la soumission' });
  }
});

// Récupérer le statut de vérification de l'utilisateur connecté
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const [verification] = await db.query(
      'SELECT status, rejection_reason, submitted_at FROM identity_verifications_new WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1',
      [req.user.id]
    );

    if (verification.length === 0) {
      return res.json({ status: 'none' });
    }

    res.json(verification[0]);
  } catch (error) {
    console.error('Erreur récupération statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Helper pour formater les chemins de fichiers d'une vérification
const formatVerificationFiles = (v) => {
  // Traiter habilitations_files
  if (v.habilitations_files) {
    if (Buffer.isBuffer(v.habilitations_files)) {
      try { v.habilitations_files = JSON.parse(v.habilitations_files.toString()); }
      catch (e) { v.habilitations_files = []; }
    }
    v.habilitations_files = Array.isArray(v.habilitations_files)
      ? v.habilitations_files.filter(p => p && typeof p === 'string' && p.trim()).map(p => p.startsWith('/') ? p : `/${p}`)
      : [];
  } else {
    v.habilitations_files = [];
  }

  // Traiter caces_files
  if (v.caces_files) {
    if (Buffer.isBuffer(v.caces_files)) {
      try { v.caces_files = JSON.parse(v.caces_files.toString()); }
      catch (e) { v.caces_files = []; }
    }
    v.caces_files = Array.isArray(v.caces_files)
      ? v.caces_files.filter(p => p && typeof p === 'string' && p.trim()).map(p => p.startsWith('/') ? p : `/${p}`)
      : [];
  } else {
    v.caces_files = [];
  }

  // Formater les autres chemins de fichiers
  ['document_recto', 'document_verso', 'selfie_with_document', 'assurance_rc',
   'justificatif_domicile', 'avis_insee', 'attestation_urssaf', 'kbis'].forEach(field => {
    if (v[field] && typeof v[field] === 'string' && v[field].trim() && !v[field].startsWith('/')) {
      v[field] = `/${v[field]}`;
    }
  });
};

// Récupérer toutes les demandes de vérification (ADMIN) avec pagination
router.get('/admin/all', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const statusFilter = ['pending', 'approved', 'rejected'].includes(req.query.status)
    ? req.query.status : null;

  try {
    // Compteurs par statut (toujours sur la totalité)
    const [counts] = await db.query(
      'SELECT status, COUNT(*) as count FROM identity_verifications_new GROUP BY status'
    );
    const stats = { all: 0, pending: 0, approved: 0, rejected: 0 };
    counts.forEach(row => { stats[row.status] = Number(row.count); stats.all += Number(row.count); });

    // Clause WHERE selon le filtre
    const where = statusFilter ? 'WHERE v.status = ?' : '';
    const params = statusFilter ? [statusFilter] : [];

    // Total pour la pagination
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM identity_verifications_new v ${where}`,
      params
    );

    const [verifications] = await db.query(
      `SELECT v.*, u.email as user_email, u.role as user_role, u.profile_picture as user_avatar
       FROM identity_verifications_new v
       JOIN users u ON v.user_id = u.id
       ${where}
       ORDER BY v.submitted_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    verifications.forEach(formatVerificationFiles);

    res.json({
      verifications,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit)
      },
      stats
    });
  } catch (error) {
    console.error('Erreur récupération vérifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Révoquer une vérification approuvée (ADMIN) - DOIT être avant la route générique /:action
router.put('/admin/:id/revoke', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { id } = req.params;

  try {
    const [verification] = await db.query(
      `SELECT v.*, u.email as user_email
       FROM identity_verifications_new v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = ?`,
      [id]
    );

    if (verification.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const verif = verification[0];

    // Mettre à jour le statut de la vérification
    await db.query(
      `UPDATE identity_verifications_new
       SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ?,
           rejection_reason = ?
       WHERE id = ?`,
      [req.user.id, "Vérification révoquée par l'administrateur", id]
    );

    // Retirer la vérification du profil
    if (verif.user_type === 'automob') {
      await db.query(
        'UPDATE automob_profiles SET id_verified = 0 WHERE user_id = ?',
        [verif.user_id]
      );
    } else {
      // Pour les clients, utiliser representative_id_verified si dispo, sinon id_verified
      const hasRep = await columnExists('client_profiles', 'representative_id_verified');
      const col = hasRep ? 'representative_id_verified' : 'id_verified';
      await db.query(
        `UPDATE client_profiles SET ${col} = 0 WHERE user_id = ?`,
        [verif.user_id]
      );
    }

    // Mettre à jour la table users
    await db.query(
      'UPDATE users SET id_verified = 0 WHERE id = ?',
      [verif.user_id]
    );

    // Envoyer email de révocation
    const userName = verif.user_type === 'automob'
      ? `${verif.first_name} ${verif.last_name}`
      : `${verif.manager_first_name} ${verif.manager_last_name}`;
    try { await sendRevocationEmail(verif.user_email, userName, verif.user_type); } catch (e) { console.error('Erreur email révocation:', e.message); }

    // Envoyer notification de révocation à l'utilisateur
    const io = req.app.get('io');
    await createNotification(
      verif.user_id,
      '⚠️ Vérification révoquée',
      'Votre vérification d\'identité a été révoquée par un administrateur. Vous pouvez soumettre une nouvelle demande.',
      'warning',
      'verification',
      verif.user_type === 'automob' ? '/automob/verify-identity' : '/client/verify-identity',
      io
    );
    console.log(`🔄 Vérification révoquée pour ${verif.user_email}`);

    res.json({ message: 'Vérification révoquée avec succès' });
  } catch (error) {
    console.error('Erreur révocation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Approuver/Rejeter une demande (ADMIN)
router.put('/admin/:id/:action', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { id, action } = req.params;
  const { rejection_reason } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action invalide' });
  }

  try {
    const [verification] = await db.query(
      `SELECT v.*, u.email as user_email, u.id as user_id
       FROM identity_verifications_new v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = ?`,
      [id]
    );

    if (verification.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const verif = verification[0];
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    await db.query(
      `UPDATE identity_verifications_new 
       SET status = ?, reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [newStatus, req.user.id, rejection_reason || null, id]
    );

    // Mettre à jour le profil si approuvé
    if (action === 'approve') {
      if (verif.user_type === 'automob') {
        // Upsert: crée la ligne si elle n'existe pas, sinon met à jour
        await db.query(
          `INSERT INTO automob_profiles (user_id, id_verified, created_at, updated_at)
           VALUES (?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE id_verified = 1, updated_at = NOW()`,
          [verif.user_id]
        );
      } else {
        // Pour les clients, utiliser representative_id_verified si dispo, sinon id_verified
        const hasRep = await columnExists('client_profiles', 'representative_id_verified');
        const col = hasRep ? 'representative_id_verified' : 'id_verified';
        // Upsert: crée la ligne si elle n'existe pas, sinon met à jour
        await db.query(
          `INSERT INTO client_profiles (user_id, ${col}, created_at, updated_at)
           VALUES (?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE ${col} = 1, updated_at = NOW()`,
          [verif.user_id]
        );
        // Aussi mettre à jour id_verified dans client_profiles si on a mis representative_id_verified
        if (hasRep) {
          await db.query(
            `UPDATE client_profiles SET id_verified = 1 WHERE user_id = ?`,
            [verif.user_id]
          );
        }
      }

      // Mettre à jour la table users (source unique pour id_verified)
      await db.query(
        'UPDATE users SET id_verified = 1 WHERE id = ?',
        [verif.user_id]
      );
      
      // Envoyer email d'approbation
      const userName = verif.user_type === 'automob' 
        ? `${verif.first_name} ${verif.last_name}`
        : `${verif.manager_first_name} ${verif.manager_last_name}`;
      try { await sendApprovalEmail(verif.user_email, userName, verif.user_type); } catch (e) { console.error('Erreur email approbation:', e.message); }
      
      // Envoyer notification à l'utilisateur
      const io = req.app.get('io');
      await createNotification(
        verif.user_id,
        '✅ Identité vérifiée',
        'Félicitations ! Votre identité a été vérifiée avec succès. Vous avez maintenant accès à toutes les fonctionnalités.',
        'success',
        'verification',
        verif.user_type === 'automob' ? '/automob/profile' : '/client/profile',
        io
      );
      
      console.log(`✅ Vérification approuvée pour ${verif.user_email}`);
    } else {
      // Envoyer email de rejet avec motif
      const userName = verif.user_type === 'automob' 
        ? `${verif.first_name} ${verif.last_name}`
        : `${verif.manager_first_name} ${verif.manager_last_name}`;
      try { await sendRejectionEmail(verif.user_email, userName, rejection_reason, verif.user_type); } catch (e) { console.error('Erreur email rejet:', e.message); }
      
      // Envoyer notification à l'utilisateur
      const io = req.app.get('io');
      await createNotification(
        verif.user_id,
        '❌ Vérification refusée',
        `Votre demande de vérification a été refusée. Raison : ${rejection_reason}. Vous pouvez soumettre une nouvelle demande.`,
        'error',
        'verification',
        verif.user_type === 'automob' ? '/automob/verify-identity' : '/client/verify-identity',
        io
      );
      
      console.log(`❌ Vérification rejetée pour ${verif.user_email}: ${rejection_reason}`);
    }

    res.json({ message: `Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès` });
  } catch (error) {
    console.error('Erreur traitement vérification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

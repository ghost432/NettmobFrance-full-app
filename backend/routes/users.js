import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import webpush from 'web-push';
import db from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { createNotification, createBulkNotifications } from '../utils/notificationHelper.js';
import { sendNotificationEmail } from '../services/emailService.js';

const router = express.Router();

const columnExists = async (table, column) => {
  const [rows] = await db.query('SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [table, column]);
  return rows?.[0]?.cnt > 0;
};

const tableExists = async (table) => {
  const [rows] = await db.query('SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [table]);
  return rows?.[0]?.cnt > 0;
};

try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(`mailto:${process.env.VAPID_EMAIL}`, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  }
} catch (error) {
  console.error('❌ Erreur configuration VAPID dans users.js:', error.message);
}

const uploadDir = 'uploads/profile';
fs.mkdirSync(uploadDir, { recursive: true });

const clampNumber = (value, min, max, defaultValue) => {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) return defaultValue;
  return Math.min(Math.max(numeric, min), max);
};

const dateToMysql = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

const encodeCursor = (session) => {
  if (!session?.login_at || !session?.id) return null;
  const loginAt = new Date(session.login_at);
  if (Number.isNaN(loginAt.getTime())) return null;
  const payload = `${loginAt.toISOString()}|${session.id}`;
  return Buffer.from(payload).toString('base64');
};

const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const [isoString, idStr] = decoded.split('|');
    if (!isoString || !idStr) throw new Error('Malformed cursor payload');
    const loginAt = new Date(isoString);
    const id = Number.parseInt(idStr, 10);
    if (Number.isNaN(loginAt.getTime()) || Number.isNaN(id)) throw new Error('Invalid cursor values');
    return { loginAt, id };
  } catch (error) {
    throw new Error('Invalid cursor');
  }
};

const buildCursorConditions = (cursor) => {
  if (!cursor) return { clause: '', params: [] };
  const loginAtMysql = dateToMysql(cursor.loginAt);
  return { clause: 'AND (login_at < ? OR (login_at = ? AND id < ?))', params: [loginAtMysql, loginAtMysql, cursor.id] };
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const fileName = `${req.user.id}_${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

const ensureProfileRow = async (table, userId, dbConnection) => {
  const conn = dbConnection || db;
  const [rows] = await conn.query(`SELECT id FROM ${table} WHERE user_id = ?`, [userId]);
  if (!rows.length) {
    const [cols] = await conn.query(`SHOW COLUMNS FROM ${table}`);
    const colNames = cols.map((c) => c.Field);
    const insertCols = ['user_id'];
    const values = ['?'];
    const params = [userId];
    if (colNames.includes('created_at')) { insertCols.push('created_at'); values.push('NOW()'); }
    if (colNames.includes('updated_at')) { insertCols.push('updated_at'); values.push('NOW()'); }
    await conn.query(`INSERT INTO ${table} (${insertCols.join(', ')}) VALUES (${values.join(', ')})`, params);
  }
};

const buildUpdateQuery = (allowedFields, payload) => {
  const updates = [];
  const params = [];
  // Champs critiques qui ne doivent pas être écrasés par des valeurs vides
  const criticalFields = ['iban', 'bic_swift'];

  Object.entries(allowedFields).forEach(([field, column]) => {
    if (payload[field] !== undefined) {
      // Si c'est un champ critique et que la valeur est vide, ne pas l'inclure dans l'update
      if (criticalFields.includes(field) && (payload[field] === '' || payload[field] === null)) {
        return; // Skip ce champ
      }

      updates.push(`${column} = ?`);
      const value = payload[field] === '' ? null : payload[field];
      params.push(value);
    }
  });
  return { updates, params };
};

const fetchAutomobProfileWithRelations = async (userId, dbConnection) => {
  const conn = dbConnection || db;
  const [profiles] = await conn.query('SELECT * FROM automob_profiles WHERE user_id = ?', [userId]);
  if (!profiles.length) {
    console.log('⚠️ [Backend] Aucun profil trouvé pour user_id:', userId);
    return null;
  }
  const profile = profiles[0];
  const profileId = profile.id;
  console.log('🔍 [Backend] Chargement profil pour user_id:', userId, 'profile_id:', profileId);
  const [[userRow]] = await conn.query('SELECT profile_picture, cover_picture FROM users WHERE id = ?', [userId]);
  profile.profile_picture = profile.profile_picture || userRow?.profile_picture || null;
  profile.cover_picture = profile.cover_picture || userRow?.cover_picture || null;
  if (profile.secteur_id) {
    const [[secteurRow]] = await conn.query('SELECT nom FROM secteurs WHERE id = ?', [profile.secteur_id]);
    profile.secteur_name = secteurRow?.nom || null;
  } else {
    profile.secteur_name = null;
  }
  // Parser work_areas si c'est une string JSON
  if (profile.work_areas && typeof profile.work_areas === 'string') {
    try {
      profile.work_areas = JSON.parse(profile.work_areas);
    } catch (e) {
      profile.work_areas = [];
    }
  }
  const [competenceRows] = await conn.query(`SELECT ac.competence_id AS id, c.nom FROM automob_competences ac JOIN competences c ON ac.competence_id = c.id WHERE ac.automob_profile_id = ? ORDER BY c.nom ASC`, [profileId]);
  profile.competence_ids = competenceRows.map((row) => row.id);
  profile.competences = competenceRows;
  console.log('✅ [Backend] Compétences chargées:', profile.competence_ids);
  const [availabilityRows] = await conn.query(`SELECT id, start_date, end_date, created_at FROM automob_availabilities WHERE automob_profile_id = ? ORDER BY start_date ASC`, [profileId]);
  profile.availabilities = availabilityRows;
  const [experienceRows] = await conn.query(`SELECT id, job_title, company_name, start_date, end_date, is_current, description, created_at FROM automob_experiences WHERE user_id = ? ORDER BY start_date DESC`, [userId]);
  profile.experiences = experienceRows;
  return profile;
};

const fetchClientProfile = async (userId, dbConnection) => {
  const conn = dbConnection || db;
  const [profiles] = await conn.query('SELECT * FROM client_profiles WHERE user_id = ?', [userId]);
  if (!profiles.length) return null;
  const profile = profiles[0];
  const [[userRow]] = await conn.query('SELECT profile_picture, cover_picture FROM users WHERE id = ?', [userId]);
  profile.profile_picture = profile.profile_picture || userRow?.profile_picture || null;
  profile.cover_picture = profile.cover_picture || userRow?.cover_picture || null;
  if (profile.secteur_id) {
    const [[secteurRow]] = await conn.query('SELECT nom FROM secteurs WHERE id = ?', [profile.secteur_id]);
    profile.secteur_name = secteurRow?.nom || null;
  } else {
    profile.secteur_name = null;
  }
  // Parser work_areas si c'est une string JSON
  if (profile.work_areas && typeof profile.work_areas === 'string') {
    try {
      profile.work_areas = JSON.parse(profile.work_areas);
    } catch (e) {
      profile.work_areas = [];
    }
  }
  const [competenceRows] = await conn.query(`SELECT c.id, c.nom FROM client_competences cc JOIN competences c ON cc.competence_id = c.id WHERE cc.client_profile_id = ? ORDER BY c.nom ASC`, [profile.id]);
  profile.competence_ids = competenceRows.map((row) => row.id);
  profile.competences = competenceRows;
  return profile;
};

router.get('/', authenticateToken, async (req, res) => {
  const { role } = req.query;
  try {
    const hasRep = await columnExists('client_profiles', 'representative_id_verified');
    const clientIdVerifiedExpr = hasRep ? 'cp.representative_id_verified' : 'cp.id_verified';
    let query = `SELECT u.id, u.email, u.role, u.verified, CASE WHEN u.role = 'automob' THEN COALESCE(ap.id_verified, u.id_verified) WHEN u.role = 'client' THEN COALESCE(${clientIdVerifiedExpr}, u.id_verified) ELSE u.id_verified END AS id_verified, u.created_at, u.last_login, u.total_session_duration, ap.first_name as automob_first_name, ap.last_name as automob_last_name, cp.company_name, CASE WHEN u.role = 'automob' AND ap.first_name IS NOT NULL THEN CONCAT(ap.first_name, ' ', COALESCE(ap.last_name, '')) WHEN u.role = 'client' AND cp.company_name IS NOT NULL THEN cp.company_name ELSE 'Sans nom' END as nom_complet FROM users u LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob' LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'`;
    let params = [];
    if (role === 'client') { query += ' WHERE u.role = ?'; params = ['client']; }
    else if (role === 'automob') { query += ' WHERE u.role = ?'; params = ['automob']; }
    query += ' ORDER BY u.created_at DESC';
    const [users] = await db.query(query, params);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  let cursor;
  try { cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null; }
  catch (error) { return res.status(400).json({ error: 'Cursor invalide' }); }
  const limit = clampNumber(req.query.limit, 5, 100, 20);
  try {
    const userId = req.user.id;
    const [userRows] = await db.query('SELECT id, email, role, last_login, total_session_duration FROM users WHERE id = ?', [userId]);
    if (!userRows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const { clause, params: cursorParams } = buildCursorConditions(cursor);
    const queryParams = [userId, ...cursorParams, limit + 1];
    const [sessions] = await db.query(`SELECT id, login_at, logout_at, duration_seconds FROM user_sessions WHERE user_id = ? ${clause} ORDER BY login_at DESC, id DESC LIMIT ?`, queryParams);
    let nextCursor = null;
    let trimmedSessions = sessions;
    if (trimmedSessions.length > limit) {
      trimmedSessions = trimmedSessions.slice(0, limit);
      const lastEntry = trimmedSessions[trimmedSessions.length - 1];
      nextCursor = encodeCursor(lastEntry);
    }
    return res.json({ user: userRows[0], sessions: trimmedSessions, pagination: { limit, nextCursor } });
  } catch (error) {
    console.error('Erreur récupération historique utilisateur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/resend-verification', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  const userId = req.params.id;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const user = users[0];

    if (user.verified) {
      return res.status(400).json({ error: 'Cet utilisateur est déjà vérifié' });
    }

    const { generateOTP, sendOTPEmail } = await import('../services/emailService.js');
    
    // Invalider les anciens codes
    await db.query(
      'UPDATE otp_codes SET verified = TRUE WHERE user_id = ? AND type = ? AND verified = FALSE',
      [userId, 'verification']
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, user.email, otp, 'verification', expiresAt]
    );

    await sendOTPEmail(user.email, otp, 'verification');

    res.json({ message: 'Email de vérification renvoyé avec succès' });
  } catch (error) {
    console.error('Erreur renvoi verification:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
});

router.put('/:id/verify', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  const { verified } = req.body;
  const userId = req.params.id;

  try {
    // Récupérer l'utilisateur avant mise à jour pour avoir email et role
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const user = users[0];

    // Mise à jour du statut
    await db.query('UPDATE users SET verified = ? WHERE id = ?', [verified, userId]);

    // Si l'utilisateur est vérifié (et ne l'était pas avant, ou juste pour confirmer), envoyer un email
    if (verified) {
      // Récupérer le profil pour le nom
      let profile = null;
      let name = '';
      if (user.role === 'automob') {
        const [profiles] = await db.query('SELECT first_name FROM automob_profiles WHERE user_id = ?', [userId]);
        profile = profiles[0];
        name = profile?.first_name || 'Utilisateur';
      } else if (user.role === 'client') {
        const [profiles] = await db.query('SELECT company_name FROM client_profiles WHERE user_id = ?', [userId]);
        profile = profiles[0];
        name = profile?.company_name || 'Partenaire';
      }

      // Envoyer l'email de confirmation
      try {
        const dashboardUrl = `${process.env.FRONTEND_URL}/${user.role}/dashboard`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">✅ Compte validé !</h2>
            <p>Bonjour ${name},</p>
            <p>Bonne nouvelle ! Votre compte a été vérifié et validé par notre équipe.</p>
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0;">Vous avez désormais accès à toutes les fonctionnalités de la plateforme.</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Accéder à mon espace
              </a>
            </div>
          </div>
        `;
        await sendNotificationEmail(user.email, 'Compte validé - NettmobFrance', html);

        // Créer une notification interne
        await createNotification(
          userId,
          'Compte validé ✅',
          'Votre compte a été validé par un administrateur. Vous avez maintenant un accès complet.',
          'success',
          'system',
          user.role === 'automob' ? '/automob/dashboard' : '/client/dashboard'
        );

      } catch (emailError) {
        console.error('Erreur envoi email validation admin:', emailError);
        // On ne bloque pas la réponse pour ça
      }
    }

    res.json({ message: 'Statut utilisateur mis à jour' });
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  try {
    const userId = req.params.id;
    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const userRole = users[0].role;
    const table = userRole === 'automob' ? 'automob_profiles' : userRole === 'client' ? 'client_profiles' : null;
    if (!table) return res.status(400).json({ error: 'Type d\'utilisateur invalide' });
    const [existingProfile] = await db.query(`SELECT id FROM ${table} WHERE user_id = ?`, [userId]);
    if (!existingProfile.length) await db.query(`INSERT INTO ${table} (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())`, [userId]);
    if (req.body.id_verified !== undefined) await db.query('UPDATE users SET id_verified = ? WHERE id = ?', [req.body.id_verified ? 1 : 0, userId]);
    const updates = [];
    const params = [];
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'email' && key !== 'verified' && key !== 'id_verified') {
        updates.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    });
    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      await db.query(`UPDATE ${table} SET ${updates.join(', ')} WHERE user_id = ?`, [...params, userId]);
      
      // Synchronisation de la photo de profil vers la table users si elle est présente dans les updates
      const profilePicIndex = Object.keys(req.body).indexOf('profile_picture');
      if (profilePicIndex !== -1) {
        await db.query('UPDATE users SET profile_picture = ? WHERE id = ?', [req.body.profile_picture, userId]);
      }
    }
    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  try {
    const [users] = await db.query('SELECT id, email, role, verified, id_verified, created_at, updated_at, last_login, total_session_duration, profile_picture, cover_picture FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const user = users[0];
    let profile = null;
    if (user.role === 'automob') {
      const [profiles] = await db.query('SELECT * FROM automob_profiles WHERE user_id = ?', [user.id]);
      profile = profiles[0];
    } else if (user.role === 'client') {
      const [profiles] = await db.query('SELECT * FROM client_profiles WHERE user_id = ?', [user.id]);
      profile = profiles[0];
    }
    res.json({ user, profile });
  } catch (error) {
    console.error('Erreur récupération détails utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });
  try {
    const [result] = await db.query('UPDATE users SET email = ? WHERE id = ?', [email, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const [users] = await db.query('SELECT id, email, role, verified, created_at, updated_at FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: users[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    console.error('Erreur mise à jour email utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/profile/automob', authenticateToken, async (req, res) => {
  if (req.user.role !== 'automob') return res.status(403).json({ error: 'Accès refusé' });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const allowedFields = { first_name: 'first_name', last_name: 'last_name', gender: 'gender', phone: 'phone', phone_country_code: 'phone_country_code', iban: 'iban', bic_swift: 'bic_swift', experience: 'experience', years_of_experience: 'years_of_experience', current_position: 'current_position', secteur_id: 'secteur_id', about_me: 'about_me', work_areas: 'work_areas', address: 'address', city: 'city', latitude: 'latitude', longitude: 'longitude', availability_start_date: 'availability_start_date', availability_end_date: 'availability_end_date', vehicle_type: 'vehicle_type', hourly_rate: 'hourly_rate', siret: 'siret' };
    const numericFields = ['latitude', 'longitude', 'hourly_rate', 'secteur_id'];
    const payload = { ...req.body };
    numericFields.forEach((field) => {
      if (payload[field] === '' || payload[field] === undefined || payload[field] === null) { delete payload[field]; return; }
      const parsed = Number(payload[field]);
      payload[field] = Number.isNaN(parsed) ? null : parsed;
    });
    ['availability_start_date', 'availability_end_date'].forEach((field) => {
      if (payload[field] === '' || payload[field] === undefined) payload[field] = null;
    });
    await ensureProfileRow('automob_profiles', req.user.id, connection);
    const [[profileRow]] = await connection.query('SELECT id FROM automob_profiles WHERE user_id = ?', [req.user.id]);
    const profileId = profileRow?.id;
    if (!profileId) throw new Error('Profil automob introuvable après création');
    const [apCols] = await connection.query('SHOW COLUMNS FROM automob_profiles');
    const apSet = new Set(apCols.map((c) => c.Field));
    const dynamicAllowed = Object.fromEntries(Object.entries(allowedFields).filter(([, col]) => apSet.has(col)));
    const { updates, params } = buildUpdateQuery(dynamicAllowed, payload);
    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      await connection.query(`UPDATE automob_profiles SET ${updates.join(', ')} WHERE user_id = ?`, [...params, req.user.id]);
    }
    if (req.body.competences) {
      console.log('💾 [Backend] Compétences reçues (raw):', req.body.competences);
      const competenceIds = JSON.parse(req.body.competences);
      console.log('💾 [Backend] Compétences parsées:', competenceIds);
      if (Array.isArray(competenceIds)) {
        await connection.query('DELETE FROM automob_competences WHERE automob_profile_id = ?', [profileId]);
        console.log('🗑️ [Backend] Anciennes compétences supprimées pour profile_id:', profileId);
        if (competenceIds.length > 0) {
          const values = competenceIds.map(id => [profileId, id]);
          await connection.query('INSERT INTO automob_competences (automob_profile_id, competence_id) VALUES ?', [values]);
          console.log(`✅ [Backend] ${competenceIds.length} compétences sauvegardées`);
        } else {
          console.log('⚠️ [Backend] Aucune compétence à sauvegarder');
        }
      }
    }
    if (req.body.availabilities) {
      const availabilities = JSON.parse(req.body.availabilities);
      if (Array.isArray(availabilities)) {
        await connection.query('DELETE FROM automob_availabilities WHERE automob_profile_id = ?', [profileId]);
        if (availabilities.length > 0) {
          const values = availabilities.map(a => [
            profileId,
            a.start_date ? a.start_date.split('T')[0] : null,
            a.end_date ? a.end_date.split('T')[0] : null
          ]);
          await connection.query('INSERT INTO automob_availabilities (automob_profile_id, start_date, end_date) VALUES ?', [values]);
        }
      }
    }
    if (req.body.experiences) {
      const experiences = JSON.parse(req.body.experiences);
      if (Array.isArray(experiences)) {
        await connection.query('DELETE FROM automob_experiences WHERE user_id = ?', [req.user.id]);
        if (experiences.length > 0) {
          const values = experiences.map(exp => [
            req.user.id,
            exp.job_title,
            exp.company_name,
            exp.start_date ? exp.start_date.split('T')[0] : null,
            exp.end_date ? exp.end_date.split('T')[0] : null,
            exp.is_current ? 1 : 0,
            exp.description || null
          ]);
          await connection.query('INSERT INTO automob_experiences (user_id, job_title, company_name, start_date, end_date, is_current, description) VALUES ?', [values]);
        }
      }
    }
    await connection.commit();
    const profile = await fetchAutomobProfileWithRelations(req.user.id, connection);
    res.json({ profile });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erreur mise à jour profil automob:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (connection) connection.release();
  }
});

router.put('/profile/client', authenticateToken, async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ error: 'Accès refusé' });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const allowedFields = { company_name: 'company_name', first_name: 'first_name', last_name: 'last_name', manager_position: 'manager_position', phone: 'phone', phone_country_code: 'phone_country_code', address: 'address', city: 'city', latitude: 'latitude', longitude: 'longitude', siret: 'siret', secteur_id: 'secteur_id', company_description: 'company_description', work_areas: 'work_areas' };
    const payload = { ...req.body };
    await ensureProfileRow('client_profiles', req.user.id, connection);
    const [[profileRow]] = await connection.query('SELECT id FROM client_profiles WHERE user_id = ?', [req.user.id]);
    const profileId = profileRow?.id;
    if (!profileId) throw new Error('Profil client introuvable après création');
    const { updates, params } = buildUpdateQuery(allowedFields, payload);
    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      await connection.query(`UPDATE client_profiles SET ${updates.join(', ')} WHERE user_id = ?`, [...params, req.user.id]);
    }
    if (payload.profils_recherches) {
      const competenceIds = JSON.parse(payload.profils_recherches);
      if (Array.isArray(competenceIds)) {
        await connection.query('DELETE FROM client_competences WHERE client_profile_id = ?', [profileId]);
        if (competenceIds.length > 0) {
          const values = competenceIds.map(id => [profileId, id]);
          await connection.query('INSERT INTO client_competences (client_profile_id, competence_id) VALUES ?', [values]);
        }
      }
    }
    await connection.commit();
    const profile = await fetchClientProfile(req.user.id, connection);
    res.json({ profile });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erreur mise à jour profil client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/profile/upload', authenticateToken, upload.fields([{ name: 'profile', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const profileFile = req.files?.profile?.[0];
  const coverFile = req.files?.cover?.[0];
  if (!profileFile && !coverFile) return res.status(400).json({ error: 'Aucun fichier fourni' });
  const profileUrl = profileFile ? `/${profileFile.path.replace(/\\/g, '/')}` : undefined;
  const coverUrl = coverFile ? `/${coverFile.path.replace(/\\/g, '/')}` : undefined;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const table = req.user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
    await ensureProfileRow(table, req.user.id, connection);
    const updates = [];
    const params = [];
    if (profileUrl) { updates.push('profile_picture = ?'); params.push(profileUrl); }
    if (coverUrl) { updates.push('cover_picture = ?'); params.push(coverUrl); }
    if (updates.length) {
      updates.push('updated_at = NOW()');
      params.push(req.user.id);
      await connection.query(`UPDATE ${table} SET ${updates.join(', ')} WHERE user_id = ?`, params);
      
      // SYNCHRONISATION CRITIQUE : Mettre aussi à jour la table users
      if (profileUrl) {
        await connection.query('UPDATE users SET profile_picture = ? WHERE id = ?', [profileUrl, req.user.id]);
      }
      if (coverUrl) {
        await connection.query('UPDATE users SET cover_picture = ? WHERE id = ?', [coverUrl, req.user.id]);
      }
    }
    await connection.commit();
    let profile;
    if (req.user.role === 'automob') profile = await fetchAutomobProfileWithRelations(req.user.id, connection);
    else profile = await fetchClientProfile(req.user.id, connection);
    res.json({ profile });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erreur upload fichier profil:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/user/:id/history', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  try {
    const targetUserId = req.params.id;
    let cursor;
    try { cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null; }
    catch (error) { return res.status(400).json({ error: 'Cursor invalide' }); }
    const limit = clampNumber(req.query.limit, 5, 100, 20);
    const [userRows] = await db.query('SELECT id, email, role, last_login, total_session_duration FROM users WHERE id = ?', [targetUserId]);
    if (!userRows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const { clause, params: cursorParams } = buildCursorConditions(cursor);
    const queryParams = [targetUserId, ...cursorParams, limit + 1];
    const [sessions] = await db.query(`SELECT id, login_at, logout_at, duration_seconds FROM user_sessions WHERE user_id = ? ${clause} ORDER BY login_at DESC, id DESC LIMIT ?`, queryParams);
    let nextCursor = null;
    let trimmedSessions = sessions;
    if (trimmedSessions.length > limit) {
      trimmedSessions = trimmedSessions.slice(0, limit);
      const lastEntry = trimmedSessions[trimmedSessions.length - 1];
      nextCursor = encodeCursor(lastEntry);
    }
    return res.json({ user: userRows[0], sessions: trimmedSessions, pagination: { limit, nextCursor } });
  } catch (error) {
    console.error('Erreur récupération historique utilisateur (admin):', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/push-subscription', authenticateToken, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;
    const role = req.user.role;
    const table = role === 'automob' ? 'automob_profiles' : role === 'client' ? 'client_profiles' : null;
    if (!table) return res.status(400).json({ error: 'Type d\'utilisateur invalide' });
    await db.query(`UPDATE ${table} SET web_push_subscription = ? WHERE user_id = ?`, [subscription, userId]);
    console.log(`✅ Souscription push enregistrée pour user ${userId}`);
    try {
      console.log('🔔 Tentative d\'envoi de notification push de bienvenue...');
      const { createNotification } = await import('../utils/notificationHelper.js');
      const [profiles] = await db.query(`SELECT first_name, company_name FROM ${table} WHERE user_id = ?`, [userId]);
      const firstName = profiles[0]?.first_name || profiles[0]?.company_name || 'Utilisateur';
      console.log(`👤 Utilisateur: ${firstName} (ID: ${userId}, Role: ${role})`);
      console.log('📤 Envoi de la notification...');
      await createNotification(userId, '🔔 Notifications activées !', `Merci ${firstName} d'avoir activé les notifications ! Vous recevrez désormais des alertes pour les nouvelles opportunités et mises à jour importantes.`, 'success', 'system', role === 'automob' ? '/automob/dashboard' : '/client/dashboard');
      console.log('✅ Notification push de bienvenue envoyée avec succès');
    } catch (notifError) {
      console.error('⚠️ Erreur envoi notification bienvenue:', notifError);
    }
    res.json({ success: true, message: 'Souscription enregistrée' });
  } catch (error) {
    console.error('Erreur sauvegarde push subscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/push-subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const table = role === 'automob' ? 'automob_profiles' : role === 'client' ? 'client_profiles' : null;
    if (!table) return res.status(400).json({ error: 'Type d\'utilisateur invalide' });
    await db.query(`UPDATE ${table} SET web_push_subscription = NULL WHERE user_id = ?`, [userId]);
    console.log(`✅ Souscription push supprimée pour user ${userId}`);
    res.json({ success: true, message: 'Souscription supprimée' });
  } catch (error) {
    console.error('Erreur suppression push subscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get notification status for user (used by NotificationActivationCard)
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    console.log(`🔍 [GET /notifications] User ID: ${userId}, Role: ${role}`);

    // Check if FCM token exists (works for all roles including admin)
    const [fcmTokens] = await db.query(
      'SELECT COUNT(*) as count FROM fcm_tokens WHERE user_id = ?',
      [userId]
    );

    const hasFCMToken = fcmTokens[0].count > 0;
    console.log(`🔍 [GET /notifications] FCM Token exists: ${hasFCMToken}`);

    // For admin, return simple status (only FCM)
    if (role === 'admin') {
      return res.json({
        hasToken: hasFCMToken,
        webPushEnabled: hasFCMToken,
        hasFCMToken,
        hasWebPushSubscription: false,
        profile: {
          web_push_enabled: hasFCMToken,
          has_subscription: false
        }
      });
    }

    // For automob and client, check profile settings
    if (role !== 'automob' && role !== 'client') {
      return res.json({
        hasToken: hasFCMToken,
        webPushEnabled: false,
        hasFCMToken,
        hasWebPushSubscription: false,
        message: 'Notifications non disponibles pour ce type d\'utilisateur'
      });
    }

    const table = role === 'automob' ? 'automob_profiles' : 'client_profiles';

    // Get notification status from profile
    const [profiles] = await db.query(
      `SELECT web_push_enabled, web_push_subscription FROM ${table} WHERE user_id = ?`,
      [userId]
    );

    if (profiles.length === 0) {
      console.warn(`⚠️ [GET /notifications] Profil non trouvé pour user ${userId}`);
      return res.status(404).json({ error: 'Profil utilisateur non trouvé' });
    }

    const profile = profiles[0];
    const hasToken = !!profile.web_push_subscription;
    const webPushEnabled = !!profile.web_push_enabled;

    console.log(`✅ [GET /notifications] Status - hasToken: ${hasToken || hasFCMToken}, webPushEnabled: ${webPushEnabled}, hasFCMToken: ${hasFCMToken}`);

    res.json({
      hasToken: hasToken || hasFCMToken,
      webPushEnabled,
      hasFCMToken,
      hasWebPushSubscription: hasToken,
      profile: {
        web_push_enabled: webPushEnabled,
        has_subscription: hasToken
      }
    });

  } catch (error) {
    console.error('❌ [GET /notifications] Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Mettre à jour les préférences de notifications
 */
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { webPushEnabled, emailNotifications, smsNotifications } = req.body;

    // Déterminer la table selon le rôle
    let tableName = '';
    if (req.user.role === 'automob') {
      tableName = 'automob_profiles';
    } else if (req.user.role === 'client') {
      tableName = 'client_profiles';
    } else {
      return res.status(400).json({ error: 'Type d\'utilisateur non supporté' });
    }

    // Construire la requête UPDATE dynamiquement
    const updates = [];
    const values = [];

    if (typeof webPushEnabled !== 'undefined') {
      updates.push('web_push_enabled = ?');
      values.push(webPushEnabled ? 1 : 0);
    }

    if (typeof emailNotifications !== 'undefined') {
      updates.push('email_notifications = ?');
      values.push(emailNotifications ? 1 : 0);
    }

    if (typeof smsNotifications !== 'undefined') {
      updates.push('sms_notifications = ?');
      values.push(smsNotifications ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune préférence à mettre à jour' });
    }

    values.push(userId);

    const query = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE user_id = ?`;
    await db.query(query, values);

    console.log(`✅ Préférences notifications mises à jour pour user ${userId}`);

    res.json({
      message: 'Préférences mises à jour avec succès',
      updated: Object.keys(req.body)
    });

  } catch (error) {
    console.error('Erreur mise à jour préférences notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get public client profile by company name (slug or exact)
router.get('/public/client/:companyName', async (req, res) => {
  try {
    const slug = decodeURIComponent(req.params.companyName).toLowerCase();
    console.log('🔍 [Backend] Fetching public client profile for slug:', slug);

    // Essayer match exact ou match sur version "sluggifiée"
    const [profiles] = await db.query(
      `SELECT * FROM client_profiles 
       WHERE LOWER(company_name) = ? 
       OR LOWER(REPLACE(company_name, ' ', '-')) = ? 
       OR LOWER(REPLACE(company_name, ' ', '')) = ?`,
      [slug, slug, slug.replace(/-/g, '')]
    );

    if (profiles.length === 0) {
      console.warn('⚠️ [Backend] Client profile not found for:', slug);
      return res.status(404).json({ error: 'Profil non trouvé' });
    }

    const profile = profiles[0];
    const [userRows] = await db.query(
      'SELECT id, email, role, verified, id_verified, profile_picture, cover_picture FROM users WHERE id = ?',
      [profile.user_id]
    );

    const user = userRows[0];

    // Enrich profile
    profile.profile_picture = profile.profile_picture || user?.profile_picture || null;
    profile.cover_picture = profile.cover_picture || user?.cover_picture || null;

    if (profile.secteur_id) {
      const [[secteurRow]] = await db.query('SELECT nom FROM secteurs WHERE id = ?', [profile.secteur_id]);
      profile.secteur_name = secteurRow?.nom || null;
    }

    // Parser work_areas
    if (profile.work_areas && typeof profile.work_areas === 'string') {
      try { profile.work_areas = JSON.parse(profile.work_areas); } catch (e) { profile.work_areas = []; }
    }

    // Competences
    const [competenceRows] = await db.query(
      `SELECT c.id, c.nom 
       FROM client_competences cc 
       JOIN competences c ON cc.competence_id = c.id 
       WHERE cc.client_profile_id = ? 
       ORDER BY c.nom ASC`,
      [profile.id]
    );
    profile.competences = competenceRows;

    console.log('✅ [Backend] Public client profile found and enriched');
    res.json({ profile, user });
  } catch (error) {
    console.error('❌ Get public client profile error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get public automob profile by name (slug)
router.get('/public/automob/:name', async (req, res) => {
  try {
    const slug = decodeURIComponent(req.params.name).toLowerCase();
    console.log('🔍 [Backend] Fetching public automob profile for slug:', slug);

    // Slug is typically firstName-lastName
    const [profiles] = await db.query(
      `SELECT * FROM automob_profiles 
       WHERE LOWER(CONCAT(first_name, '-', last_name)) = ? 
       OR LOWER(CONCAT(first_name, ' ', last_name)) = ? 
       OR LOWER(first_name) = ?`,
      [slug, slug.replace(/-/g, ' '), slug]
    );

    if (profiles.length === 0) {
      console.warn('⚠️ [Backend] Automob profile not found for slug:', slug);
      return res.status(404).json({ error: 'Profil non trouvé' });
    }

    const profile = profiles[0];
    const profileId = profile.id;
    const userId = profile.user_id;

    const [userRows] = await db.query(
      'SELECT id, email, role, verified, id_verified, profile_picture, cover_picture FROM users WHERE id = ?',
      [userId]
    );
    const user = userRows[0];

    // Enrich profile
    profile.profile_picture = profile.profile_picture || user?.profile_picture || null;
    profile.cover_picture = profile.cover_picture || user?.cover_picture || null;

    if (profile.secteur_id) {
      const [[secteurRow]] = await db.query('SELECT nom FROM secteurs WHERE id = ?', [profile.secteur_id]);
      profile.secteur_name = secteurRow?.nom || null;
    }

    if (profile.work_areas && typeof profile.work_areas === 'string') {
      try { profile.work_areas = JSON.parse(profile.work_areas); } catch (e) { profile.work_areas = []; }
    }

    const [competenceRows] = await db.query(
      `SELECT ac.competence_id AS id, c.nom 
       FROM automob_competences ac 
       JOIN competences c ON ac.competence_id = c.id 
       WHERE ac.automob_profile_id = ? 
       ORDER BY c.nom ASC`,
      [profileId]
    );
    profile.competences = competenceRows;

    const [availabilityRows] = await db.query(
      `SELECT id, start_date, end_date 
       FROM automob_availabilities 
       WHERE automob_profile_id = ? 
       ORDER BY start_date ASC`,
      [profileId]
    );
    profile.availabilities = availabilityRows.map(a => ({
      ...a,
      start_date: a.start_date ? a.start_date.toISOString().split('T')[0] : null,
      end_date: a.end_date ? a.end_date.toISOString().split('T')[0] : null
    }));

    const [experienceRows] = await db.query(
      `SELECT id, job_title, company_name, start_date, end_date, is_current, description 
       FROM automob_experiences 
       WHERE user_id = ? 
       ORDER BY start_date DESC`,
      [userId]
    );
    profile.experiences = experienceRows.map(exp => ({
      ...exp,
      start_date: exp.start_date ? exp.start_date.toISOString().split('T')[0] : null,
      end_date: exp.end_date ? exp.end_date.toISOString().split('T')[0] : null
    }));

    console.log('✅ [Backend] Public automob profile found and enriched');
    res.json({ profile, user });
  } catch (error) {
    console.error('❌ Get public automob profile error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;


import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';
import { sendSMS, sendBulkSMS, checkTwilioConfig } from '../services/twilioService.js';

const router = express.Router();

/**
 * Vérifier la configuration Twilio (ADMIN uniquement)
 */
router.get('/config-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Réservé aux administrateurs.' });
    }

    const status = checkTwilioConfig();
    res.json(status);
  } catch (error) {
    console.error('❌ Erreur vérification config Twilio:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Récupérer les statistiques SMS (ADMIN uniquement)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Compter les utilisateurs avec numéro de téléphone
    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
    
    const [usersWithPhone] = await db.query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE ap.phone IS NOT NULL OR cp.phone IS NOT NULL
    `);
    
    const [automobWithPhone] = await db.query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'automob' AND ap.phone IS NOT NULL
    `);
    
    const [clientWithPhone] = await db.query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN client_profiles cp ON u.id = cp.user_id
      WHERE u.role = 'client' AND cp.phone IS NOT NULL
    `);

    res.json({
      totalUsers: totalUsers[0].count,
      usersWithPhone: usersWithPhone[0].count,
      automobWithPhone: automobWithPhone[0].count,
      clientWithPhone: clientWithPhone[0].count,
      coverageRate: ((usersWithPhone[0].count / totalUsers[0].count) * 100).toFixed(2) + '%'
    });
  } catch (error) {
    console.error('❌ Erreur récupération stats SMS:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Envoyer un SMS de test (utilisateur connecté)
 */
router.post('/send-test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le numéro de téléphone de l'utilisateur
    let phone = null;
    
    if (req.user.role === 'automob') {
      const [profile] = await db.query(
        'SELECT phone FROM automob_profiles WHERE user_id = ?',
        [userId]
      );
      phone = profile[0]?.phone;
    } else if (req.user.role === 'client') {
      const [profile] = await db.query(
        'SELECT phone FROM client_profiles WHERE user_id = ?',
        [userId]
      );
      phone = profile[0]?.phone;
    }

    if (!phone) {
      return res.status(400).json({ 
        error: 'Aucun numéro de téléphone trouvé dans votre profil' 
      });
    }

    const message = `🧪 Test SMS NettmobFrance
Ceci est un message de test. Votre système de notifications SMS fonctionne correctement ! ✅`;

    const result = await sendSMS(phone, message);

    res.json({
      message: 'SMS de test envoyé avec succès',
      phone: result.to,
      sid: result.sid
    });
  } catch (error) {
    console.error('❌ Erreur envoi SMS test:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de l\'envoi du SMS de test' 
    });
  }
});

/**
 * Envoyer un SMS à tous les utilisateurs ou à un rôle spécifique (ADMIN uniquement)
 */
router.post('/send-to-all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Réservé aux administrateurs.' });
    }

    const { message, link, targetRole } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Ajouter le lien au message si fourni
    const fullMessage = link ? `${message}\n\n🔗 ${link}` : message;

    // Construire la requête selon le rôle ciblé
    let query = `
      SELECT DISTINCT 
        u.id,
        u.email,
        u.role,
        COALESCE(ap.phone, cp.phone) as phone
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE COALESCE(ap.phone, cp.phone) IS NOT NULL
    `;

    const queryParams = [];

    if (targetRole && targetRole !== 'all') {
      query += ' AND u.role = ?';
      queryParams.push(targetRole);
    }

    const [users] = await db.query(query, queryParams);

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun utilisateur avec numéro de téléphone pour ce rôle' 
      });
    }

    const phoneNumbers = users.map(u => u.phone);

    const targetDescription = targetRole && targetRole !== 'all' 
      ? `${targetRole}s` 
      : 'tous les utilisateurs';

    console.log(`📤 Envoi de SMS à ${phoneNumbers.length} ${targetDescription}...`);

    const result = await sendBulkSMS(phoneNumbers, fullMessage);

    res.json({
      message: 'Envoi SMS terminé',
      total: result.total,
      success: result.success,
      failed: result.failed,
      errors: result.errors,
      targetRole: targetRole || 'all'
    });
  } catch (error) {
    console.error('❌ Erreur envoi SMS groupé:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des SMS' });
  }
});

/**
 * Récupérer la liste des utilisateurs par rôle avec téléphone (ADMIN uniquement)
 */
router.get('/users-by-role', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { role } = req.query;

    let query = `
      SELECT 
        u.id,
        u.email,
        u.role,
        COALESCE(
          CONCAT(COALESCE(ap.first_name, ''), ' ', COALESCE(ap.last_name, '')),
          CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, '')),
          u.email
        ) as full_name,
        cp.company_name as company_name,
        COALESCE(ap.phone, cp.phone) as phone
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
      LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
      WHERE 1=1
    `;

    const queryParams = [];

    if (role && role !== 'all') {
      query += ' AND u.role = ?';
      queryParams.push(role);
    }

    // Filtrer les utilisateurs qui ont un profil complet
    query += ` AND (
      (u.role = 'automob' AND ap.user_id IS NOT NULL) OR
      (u.role = 'client' AND cp.user_id IS NOT NULL) OR
      u.role = 'admin'
    )`;

    query += ' ORDER BY u.created_at DESC';

    const [users] = await db.query(query, queryParams);

    console.log(`✅ ${users.length} utilisateurs trouvés pour le rôle: ${role || 'all'}`);

    res.json(users);
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Envoyer un SMS à un utilisateur spécifique (ADMIN uniquement)
 */
router.post('/send-to-user', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Réservé aux administrateurs.' });
    }

    const { message, link, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message et utilisateur requis' });
    }

    // Ajouter le lien au message si fourni
    const fullMessage = link ? `${message}\n\n🔗 ${link}` : message;

    // Récupérer le numéro de téléphone de l'utilisateur
    const [users] = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        COALESCE(ap.phone, cp.phone) as phone
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    if (!user.phone) {
      return res.status(400).json({ 
        error: 'Cet utilisateur n\'a pas renseigné de numéro de téléphone' 
      });
    }

    console.log(`📤 Envoi de SMS à l'utilisateur ${userId}...`);

    const result = await sendSMS(user.phone, fullMessage);

    console.log(`✅ SMS envoyé à l'utilisateur ${userId}`);

    res.json({
      message: 'SMS envoyé avec succès',
      success: true,
      userId: userId,
      phone: result.to
    });
  } catch (error) {
    console.error('❌ Erreur envoi SMS utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du SMS' });
  }
});

/**
 * Envoyer un SMS à des utilisateurs spécifiques (ADMIN uniquement)
 */
router.post('/send-to-users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Réservé aux administrateurs.' });
    }

    const { message, userIds } = req.body;

    if (!message || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Message et liste d\'utilisateurs requis' });
    }

    // Récupérer les numéros de téléphone des utilisateurs ciblés
    const placeholders = userIds.map(() => '?').join(',');
    const [users] = await db.query(`
      SELECT DISTINCT 
        u.id,
        u.email,
        COALESCE(ap.phone, cp.phone) as phone
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE u.id IN (${placeholders})
        AND COALESCE(ap.phone, cp.phone) IS NOT NULL
    `, userIds);

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun utilisateur avec numéro de téléphone trouvé' 
      });
    }

    const phoneNumbers = users.map(u => u.phone);

    console.log(`📤 Envoi de SMS à ${phoneNumbers.length} utilisateurs spécifiques...`);

    const result = await sendBulkSMS(phoneNumbers, message);

    res.json({
      message: 'Envoi SMS terminé',
      total: result.total,
      success: result.success,
      failed: result.failed,
      errors: result.errors
    });
  } catch (error) {
    console.error('❌ Erreur envoi SMS spécifiques:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des SMS' });
  }
});

export default router;

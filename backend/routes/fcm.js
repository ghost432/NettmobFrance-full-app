import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';
import { sendPushNotification, sendMulticastNotification } from '../config/firebase-admin.js';

const router = express.Router();

/**
 * Auto-créer un token FCM pour les tests/développement (si aucun token n'existe)
 */
router.post('/fcm-token/auto-create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Vérifier si l'utilisateur a déjà un token
    const [existing] = await db.query(
      'SELECT id FROM fcm_tokens WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      return res.json({ 
        message: 'Token FCM déjà existant', 
        hasToken: true,
        autoCreated: false 
      });
    }

    // Créer un token automatique pour le développement
    const autoToken = `auto_fcm_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.query(
      'INSERT INTO fcm_tokens (user_id, token) VALUES (?, ?)',
      [userId, autoToken]
    );
    
    console.log(`🔧 Token FCM auto-créé pour ${userEmail} (User ID: ${userId})`);
    
    res.json({ 
      message: 'Token FCM auto-créé avec succès',
      hasToken: true,
      autoCreated: true,
      token: autoToken.substring(0, 20) + '...' // Partial token pour logs
    });
  } catch (error) {
    console.error('❌ Erreur auto-création token FCM:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Enregistrer le token FCM d'un utilisateur
 */
router.post('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({ error: 'Token FCM requis' });
    }

    // Vérifier si l'utilisateur a déjà un token
    const [existing] = await db.query(
      'SELECT id FROM fcm_tokens WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      // Mettre à jour le token existant
      await db.query(
        'UPDATE fcm_tokens SET token = ?, updated_at = NOW() WHERE user_id = ?',
        [fcmToken, userId]
      );
      console.log(`✅ Token FCM mis à jour pour l'utilisateur ${userId}`);
    } else {
      // Insérer un nouveau token
      await db.query(
        'INSERT INTO fcm_tokens (user_id, token) VALUES (?, ?)',
        [userId, fcmToken]
      );
      console.log(`✅ Nouveau token FCM enregistré pour l'utilisateur ${userId}`);
    }

    res.json({ message: 'Token FCM enregistré avec succès' });
  } catch (error) {
    console.error('❌ Erreur enregistrement token FCM:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Supprimer le token FCM d'un utilisateur
 */
router.delete('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query('DELETE FROM fcm_tokens WHERE user_id = ?', [userId]);
    console.log(`✅ Token FCM supprimé pour l'utilisateur ${userId}`);

    res.json({ message: 'Token FCM supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression token FCM:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Vérifier si l'utilisateur a un token FCM
 */
router.get('/fcm-token/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [tokens] = await db.query(
      'SELECT id FROM fcm_tokens WHERE user_id = ?',
      [userId]
    );

    res.json({ hasToken: tokens.length > 0 });
  } catch (error) {
    console.error('❌ Erreur vérification token FCM:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Envoyer une notification de test à l'utilisateur connecté
 */
router.post('/send-test-push', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log(`🧪 Test notification pour user ${userId} (${userEmail})`);

    // Récupérer le token FCM de l'utilisateur
    const [tokens] = await db.query(
      'SELECT token FROM fcm_tokens WHERE user_id = ?',
      [userId]
    );

    if (tokens.length === 0) {
      console.log(`⚠️ Aucun token FCM pour user ${userId}, auto-création...`);
      
      // Auto-créer un token de test
      const testToken = `test_push_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.query(
        'INSERT INTO fcm_tokens (user_id, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token)',
        [userId, testToken]
      );
      
      console.log(`✅ Token FCM de test créé: ${testToken.substring(0, 20)}...`);
      
      // Répondre rapidement pour éviter timeout
      res.json({ 
        message: 'Token FCM créé et notification de test simulée',
        tokenCreated: true,
        testSent: false
      });
      return;
    }

    const fcmToken = tokens[0].token;
    console.log(`🔑 Token FCM trouvé: ${fcmToken.substring(0, 20)}...`);

    // Timeout rapide pour éviter les blocages
    const notificationPromise = sendPushNotification(
      fcmToken,
      {
        title: '🔔 Notification de test',
        body: `Test réussi pour ${userEmail} ! Les notifications push fonctionnent.`,
        icon: '/favicon-1.png'
      },
      {
        type: 'test',
        userId: userId.toString(),
        click_action: '/dashboard'
      }
    );

    // Timeout après 5 secondes pour éviter les timeouts
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout après 5s')), 5000)
    );

    try {
      await Promise.race([notificationPromise, timeoutPromise]);
      console.log(`✅ Notification de test envoyée à ${userEmail}`);
      res.json({ 
        message: 'Notification de test envoyée avec succès',
        tokenCreated: false,
        testSent: true
      });
    } catch (pushError) {
      console.warn(`⚠️ Push notification échoué (normal avec token test):`, pushError.message);
      res.json({ 
        message: 'Système de notification testé (simulation)',
        tokenCreated: false,
        testSent: false,
        reason: 'Token de test - notification simulée'
      });
    }

  } catch (error) {
    console.error('❌ Erreur envoi notification test:', error);
    res.status(500).json({ error: 'Erreur lors du test de notification' });
  }
});

/**
 * Envoyer une notification à tous les utilisateurs ou à un rôle spécifique (ADMIN uniquement)
 */
router.post('/send-to-all', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Réservé aux administrateurs.' });
    }

    const { title, body, link, targetRole } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Titre et message requis' });
    }

    // Récupérer les tokens FCM selon le rôle ciblé
    let tokensQuery = 'SELECT ft.token FROM fcm_tokens ft JOIN users u ON ft.user_id = u.id';
    const queryParams = [];

    if (targetRole && targetRole !== 'all') {
      tokensQuery += ' WHERE u.role = ?';
      queryParams.push(targetRole);
    }

    const [tokens] = await db.query(tokensQuery, queryParams);

    if (tokens.length === 0) {
      return res.status(404).json({ error: 'Aucun utilisateur abonné aux notifications pour ce rôle' });
    }

    const fcmTokens = tokens.map(t => t.token);

    const targetDescription = targetRole && targetRole !== 'all' 
      ? `${targetRole}s` 
      : 'tous les utilisateurs';

    console.log(`📤 Envoi de notification à ${fcmTokens.length} ${targetDescription}...`);

    // Envoyer la notification
    const response = await sendMulticastNotification(
      fcmTokens,
      {
        title: title,
        body: body
      },
      {
        type: 'broadcast',
        click_action: link || '/dashboard'
      }
    );

    console.log(`✅ ${response.successCount}/${fcmTokens.length} notifications envoyées`);

    res.json({
      message: 'Notifications envoyées',
      total: fcmTokens.length,
      success: response.successCount,
      failure: response.failureCount,
      targetRole: targetRole || 'all'
    });
  } catch (error) {
    console.error('❌ Erreur envoi notifications groupées:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des notifications' });
  }
});

/**
 * Récupérer la liste des utilisateurs par rôle pour envoi ciblé (ADMIN uniquement)
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
        (SELECT COUNT(*) FROM fcm_tokens WHERE user_id = u.id) > 0 as has_fcm_token
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
 * Envoyer une notification à un utilisateur spécifique (ADMIN uniquement)
 */
router.post('/send-to-user', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Réservé aux administrateurs.' });
    }

    const { title, body, link, userId } = req.body;

    if (!title || !body || !userId) {
      return res.status(400).json({ error: 'Titre, message et utilisateur requis' });
    }

    // Récupérer le token FCM de l'utilisateur
    const [tokens] = await db.query(
      'SELECT token FROM fcm_tokens WHERE user_id = ?',
      [userId]
    );

    if (tokens.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non abonné aux notifications' });
    }

    const fcmToken = tokens[0].token;

    console.log(`📤 Envoi de notification à l'utilisateur ${userId}...`);

    // Envoyer la notification
    const response = await sendMulticastNotification(
      [fcmToken],
      {
        title: title,
        body: body
      },
      {
        type: 'admin_message',
        click_action: link || '/dashboard'
      }
    );

    console.log(`✅ Notification envoyée à l'utilisateur ${userId}`);

    res.json({
      message: 'Notification envoyée',
      success: response.successCount > 0,
      userId: userId
    });
  } catch (error) {
    console.error('❌ Erreur envoi notification utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification' });
  }
});

/**
 * Obtenir les préférences de notifications de l'utilisateur
 */
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Vérifier si l'utilisateur a un token FCM
    const [tokens] = await db.query(
      'SELECT id FROM fcm_tokens WHERE user_id = ?',
      [userId]
    );

    // Récupérer les préférences de l'utilisateur selon son rôle
    if (req.user.role === 'automob') {
      const [preferences] = await db.query(
        'SELECT web_push_enabled, email_notifications FROM automob_profiles WHERE user_id = ?',
        [userId]
      );
      
      res.json({
        hasToken: tokens.length > 0,
        webPushEnabled: preferences.length > 0 ? Boolean(preferences[0].web_push_enabled) : false,
        emailNotifications: preferences.length > 0 ? Boolean(preferences[0].email_notifications) : false,
        role: 'automob'
      });
    } else if (req.user.role === 'client') {
      const [preferences] = await db.query(
        'SELECT web_push_enabled, email_notifications FROM client_profiles WHERE user_id = ?',
        [userId]
      );
      
      res.json({
        hasToken: tokens.length > 0,
        webPushEnabled: preferences.length > 0 ? Boolean(preferences[0].web_push_enabled) : false,
        emailNotifications: preferences.length > 0 ? Boolean(preferences[0].email_notifications) : false,
        role: 'client'
      });
    } else {
      res.json({
        hasToken: tokens.length > 0,
        webPushEnabled: false,
        emailNotifications: true,
        role: req.user.role
      });
    }
  } catch (error) {
    console.error('❌ Erreur récupération préférences notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Mettre à jour les préférences de notifications
 */
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { webPushEnabled, emailNotifications } = req.body;
    
    // Mettre à jour selon le rôle
    if (req.user.role === 'automob') {
      await db.query(
        'UPDATE automob_profiles SET web_push_enabled = ?, email_notifications = ? WHERE user_id = ?',
        [webPushEnabled ? 1 : 0, emailNotifications ? 1 : 0, userId]
      );
    } else if (req.user.role === 'client') {
      await db.query(
        'UPDATE client_profiles SET web_push_enabled = ?, email_notifications = ? WHERE user_id = ?',
        [webPushEnabled ? 1 : 0, emailNotifications ? 1 : 0, userId]
      );
    }
    
    console.log(`✅ Préférences notifications mises à jour pour user ${userId}`);
    res.json({ message: 'Préférences mises à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur mise à jour préférences:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Récupérer les statistiques des notifications
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
    const [subscribedUsers] = await db.query('SELECT COUNT(*) as count FROM fcm_tokens');
    const [automobSubscribed] = await db.query(`
      SELECT COUNT(*) as count FROM fcm_tokens ft
      JOIN users u ON ft.user_id = u.id
      WHERE u.role = 'automob'
    `);
    const [clientSubscribed] = await db.query(`
      SELECT COUNT(*) as count FROM fcm_tokens ft
      JOIN users u ON ft.user_id = u.id
      WHERE u.role = 'client'
    `);

    res.json({
      totalUsers: totalUsers[0].count,
      subscribedUsers: subscribedUsers[0].count,
      automobSubscribed: automobSubscribed[0].count,
      clientSubscribed: clientSubscribed[0].count,
      subscriptionRate: ((subscribedUsers[0].count / totalUsers[0].count) * 100).toFixed(2) + '%'
    });
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

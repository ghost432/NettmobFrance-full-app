import express from 'express';
import webpush from 'web-push';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendNotificationEmail } from '../services/emailService.js';

const router = express.Router();

// Configuration Web Push avec VAPID
console.log('🔐 Configuration VAPID pour routes notifications:');
console.log('  Email:', process.env.VAPID_EMAIL);
console.log('  Public Key:', process.env.VAPID_PUBLIC_KEY?.substring(0, 20) + '...');
console.log('  Private Key:', process.env.VAPID_PRIVATE_KEY ? '✅ Configurée' : '❌ Manquante');

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

console.log('✅ VAPID configuré avec succès pour routes notifications');

// Récupérer toutes les notifications de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, unread_only = false } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];
    
    if (unread_only === 'true') {
      query += ' AND is_read = 0';
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [notifications] = await db.query(query, params);
    
    res.json(notifications);
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Compter les notifications non lues
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const [[result]] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    
    res.json({ count: result.count });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer une notification comme lue
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur marquage toutes notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer toutes les notifications lues
router.delete('/read/all', authenticateToken, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notifications WHERE user_id = ? AND is_read = 1',
      [req.user.id]
    );
    
    res.json({ message: 'Toutes les notifications lues ont été supprimées' });
  } catch (error) {
    console.error('Erreur suppression notifications lues:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une notification (utilisé par le système ou admin)
router.post('/', authenticateToken, async (req, res) => {
  // Seulement admin peut créer des notifications pour d'autres utilisateurs
  if (req.user.role !== 'admin' && req.body.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  try {
    const { user_id, title, message, type = 'info', category = 'system', action_url = null } = req.body;
    
    if (!user_id || !title || !message) {
      return res.status(400).json({ error: 'Données manquantes' });
    }
    
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, category, action_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, title, message, type, category, action_url]
    );
    
    const notification = {
      id: result.insertId,
      title,
      message,
      type,
      category,
      action_url,
      created_at: new Date()
    };
    
    // Émettre via WebSocket si disponible (notification dans l'app)
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${user_id}`).emit('new_notification', notification);
    }
    
    // Envoyer Web Push (notification hors de l'app)
    console.log(`📱 Envoi Web Push pour user ${user_id}...`);
    try {
      // Récupérer l'utilisateur pour connaître son rôle
      const [[user]] = await db.query('SELECT role FROM users WHERE id = ?', [user_id]);
      
      if (user && (user.role === 'automob' || user.role === 'client')) {
        const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
        const [[profile]] = await db.query(
          `SELECT web_push_subscription, web_push_enabled FROM ${table} WHERE user_id = ?`,
          [user_id]
        );
        
        if (profile?.web_push_enabled && profile?.web_push_subscription) {
          const subscription = JSON.parse(profile.web_push_subscription);
          const payload = JSON.stringify({
            title,
            message,
            action_url: action_url || '/notifications',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png'
          });
          
          await webpush.sendNotification(subscription, payload);
          console.log(`✅ Web Push envoyé à user ${user_id}`);
        } else {
          console.log(`⚠️ Web Push désactivé ou non configuré pour user ${user_id}`);
        }
      }
    } catch (pushError) {
      // Si erreur Web Push, on continue quand même (ne pas bloquer la notification)
      if (pushError.statusCode === 410 || pushError.statusCode === 404) {
        const [[user]] = await db.query('SELECT role FROM users WHERE id = ?', [user_id]);
        if (user) {
          const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
          await db.query(`UPDATE ${table} SET web_push_subscription = NULL WHERE user_id = ?`, [user_id]);
          console.log(`🔄 Souscription push expirée supprimée pour user ${user_id}`);
        }
      } else {
        console.error(`❌ Erreur Web Push pour user ${user_id}:`, pushError.message);
      }
    }
    
    res.status(201).json({ 
      message: 'Notification créée',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur création notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer une notification ciblée (admin only)
router.post('/send-targeted', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  try {
    const { 
      title, 
      message, 
      type = 'info', 
      category = 'system', 
      action_url = null,
      target_type = 'all', // all, role, user
      target_value = null, // role name or user_id
      send_email = false
    } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Titre et message requis' });
    }
    
    let users = [];
    let query = '';
    let params = [];
    
    // Déterminer les utilisateurs cibles
    if (target_type === 'all') {
      [users] = await db.query('SELECT id, email, role FROM users');
    } else if (target_type === 'role') {
      if (!target_value) {
        return res.status(400).json({ error: 'Rôle requis' });
      }
      [users] = await db.query('SELECT id, email, role FROM users WHERE role = ?', [target_value]);
    } else if (target_type === 'user') {
      if (!target_value) {
        return res.status(400).json({ error: 'ID utilisateur requis' });
      }
      [users] = await db.query('SELECT id, email, role FROM users WHERE id = ?', [target_value]);
    }
    
    if (users.length === 0) {
      return res.json({ message: 'Aucun utilisateur trouvé', count: 0 });
    }
    
    // Créer les notifications
    const values = users.map(user => [user.id, title, message, type, category, action_url]);
    
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, category, action_url) 
       VALUES ?`,
      [values]
    );
    
    // Émettre via WebSocket
    const io = req.app.get('io');
    if (io) {
      const notification = {
        title,
        message,
        type,
        category,
        action_url,
        created_at: new Date()
      };
      
      users.forEach(user => {
        io.to(`user_${user.id}`).emit('new_notification', notification);
      });
    }
    
    // Envoyer par email si demandé
    if (send_email) {
      console.log('📧 Envoi d\'emails pour', users.length, 'utilisateur(s)...');
      const emailPromises = users.map(user => 
        sendNotificationEmail(user.email, title, message, action_url)
          .catch(err => console.error(`❌ Erreur email pour ${user.email}:`, err.message))
      );
      await Promise.allSettled(emailPromises);
      console.log('✅ Emails envoyés');
    }
    
    // Envoyer les notifications web push
    console.log('📱 Envoi des notifications push...');
    let pushCount = 0;
    for (const user of users) {
      try {
        // Récupérer le profil selon le rôle
        let subscription = null;
        if (user.role === 'automob' || user.role === 'client') {
          const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
          const [[profile]] = await db.query(
            `SELECT web_push_subscription, web_push_enabled FROM ${table} WHERE user_id = ?`,
            [user.id]
          );
          
          if (profile?.web_push_enabled && profile?.web_push_subscription) {
            subscription = JSON.parse(profile.web_push_subscription);
          }
        }
        
        if (subscription) {
          const payload = JSON.stringify({
            title,
            message,
            action_url: action_url || '/notifications',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png'
          });
          
          await webpush.sendNotification(subscription, payload);
          pushCount++;
        }
      } catch (error) {
        // Si la souscription est invalide, la supprimer
        if (error.statusCode === 410 || error.statusCode === 404) {
          const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
          await db.query(
            `UPDATE ${table} SET web_push_subscription = NULL WHERE user_id = ?`,
            [user.id]
          );
          console.log(`🔄 Souscription push expirée supprimée pour user ${user.id}`);
        }
      }
    }
    console.log(`✅ ${pushCount} notification(s) push envoyée(s)`);
    
    console.log(`📢 Notification envoyée à ${users.length} utilisateur(s) (${target_type})`);
    res.status(201).json({ 
      message: `Notification envoyée à ${users.length} utilisateur(s)`,
      count: users.length,
      pushCount,
      recipients: users.map(u => ({ id: u.id, email: u.email }))
    });
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les utilisateurs par rôle (pour le formulaire)
router.get('/users-by-role/:role', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  try {
    const { role } = req.params;
    const [users] = await db.query(
      'SELECT id, email FROM users WHERE role = ? ORDER BY email',
      [role]
    );
    res.json(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de test pour envoyer une notification Web Push à tous les utilisateurs (admin only)
router.post('/test-web-push', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  try {
    console.log('🧪 Test Web Push - Récupération de tous les utilisateurs...');
    
    // Récupérer tous les utilisateurs
    const [users] = await db.query('SELECT id, email, role FROM users');
    
    let successCount = 0;
    let failCount = 0;
    let noSubscriptionCount = 0;
    const results = [];
    
    for (const user of users) {
      try {
        // Récupérer le profil selon le rôle
        let subscription = null;
        let pushEnabled = false;
        
        if (user.role === 'automob' || user.role === 'client') {
          const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
          const [[profile]] = await db.query(
            `SELECT web_push_subscription, web_push_enabled FROM ${table} WHERE user_id = ?`,
            [user.id]
          );
          
          if (profile) {
            pushEnabled = profile.web_push_enabled;
            if (profile.web_push_subscription) {
              subscription = JSON.parse(profile.web_push_subscription);
            }
          }
        }
        
        if (!subscription) {
          noSubscriptionCount++;
          results.push({
            userId: user.id,
            email: user.email,
            status: 'no_subscription',
            message: pushEnabled ? 'Pas de souscription enregistrée' : 'Web Push désactivé'
          });
          continue;
        }
        
        // Envoyer la notification de test
        const payload = JSON.stringify({
          title: '🧪 Test de notification Web Push',
          message: 'Si vous voyez ce message, les notifications Web Push fonctionnent correctement !',
          action_url: '/notifications',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png'
        });
        
        await webpush.sendNotification(subscription, payload);
        successCount++;
        results.push({
          userId: user.id,
          email: user.email,
          status: 'success',
          message: 'Notification envoyée'
        });
        
        console.log(`✅ Notification test envoyée à ${user.email}`);
        
      } catch (error) {
        failCount++;
        
        // Si la souscription est invalide, la supprimer
        if (error.statusCode === 410 || error.statusCode === 404) {
          const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
          await db.query(
            `UPDATE ${table} SET web_push_subscription = NULL WHERE user_id = ?`,
            [user.id]
          );
          results.push({
            userId: user.id,
            email: user.email,
            status: 'expired',
            message: 'Souscription expirée (supprimée)'
          });
          console.log(`🔄 Souscription expirée supprimée pour ${user.email}`);
        } else {
          results.push({
            userId: user.id,
            email: user.email,
            status: 'error',
            message: error.message
          });
          console.error(`❌ Erreur envoi à ${user.email}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Résultats du test Web Push:`);
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ❌ Échecs: ${failCount}`);
    console.log(`   ⚠️  Sans souscription: ${noSubscriptionCount}`);
    console.log(`   📧 Total utilisateurs: ${users.length}`);
    
    res.json({
      message: 'Test Web Push terminé',
      totalUsers: users.length,
      successCount,
      failCount,
      noSubscriptionCount,
      results
    });
    
  } catch (error) {
    console.error('Erreur test Web Push:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

export default router;

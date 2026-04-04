import db from '../config/database.js';
import { initializeFirebase } from '../config/firebase-admin.js';
import webpush from 'web-push';
import { sendFCMNotificationToUser } from '../services/fcmNotificationService.js';

// Initialiser Firebase au démarrage
initializeFirebase();

// Configuration Web Push avec VAPID (tolérante si non configurée)
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'support@localhost';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
let VAPID_READY = false;

console.log('🔐 Configuration VAPID pour Web Push:');
console.log('  Email:', VAPID_EMAIL);
console.log('  Public Key:', VAPID_PUBLIC_KEY ? VAPID_PUBLIC_KEY.substring(0, 20) + '...' : '❌ Manquante');
console.log('  Private Key:', VAPID_PRIVATE_KEY ? '✅ Configurée' : '❌ Manquante');

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      `mailto:${VAPID_EMAIL}`,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    VAPID_READY = true;
    console.log('✅ VAPID configuré avec succès pour notificationHelper');
  } catch (e) {
    console.error('❌ Erreur configuration VAPID:', e?.message || e);
    console.log('⚠️ Web Push sera désactivé.');
  }
} else {
  console.log('⚠️ VAPID non configuré. Web Push sera désactivé.');
}

/**
 * Envoie une notification Web Push à un utilisateur avec VAPID
 */
const sendWebPush = async (userId, title, message, actionUrl) => {
  try {
    if (!VAPID_READY) {
      console.log(`⚠️ Web Push désactivé (VAPID manquant) pour user ${userId}`);
      return;
    }
    // Récupérer le rôle de l'utilisateur
    const [[user]] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (!user) {
      console.log(`⚠️ User ${userId} non trouvé pour Web Push`);
      return;
    }

    const table = user.role === 'automob' ? 'automob_profiles' : 
                  user.role === 'client' ? 'client_profiles' : null;
    
    if (!table) {
      console.log(`⚠️ Rôle ${user.role} non supporté pour Web Push`);
      return;
    }

    // Récupérer la souscription Web Push
    const [[profile]] = await db.query(
      `SELECT web_push_subscription, web_push_enabled FROM ${table} WHERE user_id = ?`,
      [userId]
    );

    // Vérifier que l'utilisateur a activé les Web Push et a une souscription
    if (!profile?.web_push_enabled) {
      console.log(`⚠️ Web Push désactivé pour user ${userId}`);
      return;
    }
    
    if (!profile?.web_push_subscription) {
      console.log(`⚠️ Aucune souscription Web Push pour user ${userId}`);
      return;
    }

    const subscription = JSON.parse(profile.web_push_subscription);
    
    console.log(`📤 Envoi Web Push à user ${userId} via VAPID...`);
    console.log(`   Endpoint:`, subscription.endpoint?.substring(0, 50) + '...');
    console.log(`   Keys:`, Object.keys(subscription.keys || {}));
    
    const payload = JSON.stringify({
      title: title || 'Notification',
      message: message || '',
      action_url: actionUrl || '/dashboard',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    });

    console.log(`   Payload size:`, payload.length, 'bytes');
    
    await webpush.sendNotification(subscription, payload);
    console.log(`✅ Web Push envoyé avec succès à user ${userId}`);
  } catch (error) {
    // Si la souscription est invalide (410 = Gone), la supprimer
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`⚠️ Souscription Web Push expirée pour user ${userId}, suppression...`);
      const [[user]] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
      if (user) {
        const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
        await db.query(
          `UPDATE ${table} SET web_push_subscription = NULL WHERE user_id = ?`,
          [userId]
        );
        console.log(`🗑️ Souscription expirée supprimée pour user ${userId}`);
      }
    } else {
      console.error(`❌ Erreur envoi Web Push user ${userId}:`);
      console.error(`   Message:`, error.message || 'Aucun message d\'erreur');
      console.error(`   Code:`, error.code || 'Aucun code');
      console.error(`   Status:`, error.statusCode || 'Aucun status');
      if (error.body) {
        console.error(`   Body:`, error.body);
      }
      if (error.stack) {
        console.error(`   Stack:`, error.stack.split('\n').slice(0, 3).join('\n'));
      }
    }
  }
};

/**
 * Crée une notification pour un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} type - Type: info, success, warning, error
 * @param {string} category - Catégorie: system, mission, message, payment, verification, account
 * @param {string|null} actionUrl - URL d'action optionnelle
 * @param {object|null} io - Instance Socket.IO optionnelle
 */
export const createNotification = async (
  userId,
  title,
  message,
  type = 'info',
  category = 'system',
  actionUrl = null,
  io = null
) => {
  try {
    // Validation des paramètres pour éviter undefined
    const validTitle = title || 'Notification';
    const validMessage = message || '';
    const validType = type || 'info';
    const validCategory = category || 'system';
    
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, category, action_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, validTitle, validMessage, validType, validCategory, actionUrl]
    );

    const notification = {
      id: result.insertId,
      user_id: userId,
      title: validTitle,
      message: validMessage,
      type: validType,
      category: validCategory,
      action_url: actionUrl,
      is_read: 0,
      created_at: new Date()
    };

    // Émettre via WebSocket si disponible (notification dans l'app)
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);
    }

    // 🚀 OPTIMISATION - Envoi des push notifications en arrière-plan (non-bloquant)
    // Ne pas attendre la complétion pour éviter les timeouts
    setImmediate(async () => {
      try {
        // [CORRECTION DOUBLON] L'envoi WebPush (VAPID) est désactivé car 
        // sendFCMNotificationToUser (Firebase Cloud Messaging) gère déjà 
        // l'envoi de la notification push proprement depuis le webhook Firebase.
        // await sendWebPush(userId, validTitle, validMessage, actionUrl);
      } catch (error) {
        console.error(`❌ Erreur Web Push async pour user ${userId}:`, error.message);
      }
    });

    // Envoyer Firebase Cloud Messaging Push (notification hors de l'app) en arrière-plan
    setImmediate(async () => {
      try {
        // 🔧 CORRECTION EXPERT - Utiliser actionUrl spécifique au lieu de /dashboard
        let clickAction = actionUrl;
        
        // Si pas d'actionUrl et que c'est une notification support, construire l'URL appropriée
        if (!actionUrl && validCategory === 'support') {
          // Récupérer le rôle de l'utilisateur pour construire l'URL support correcte
          const [[user]] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
          if (user && user.role) {
            clickAction = `/${user.role}/support`;
          } else {
            clickAction = '/dashboard';
          }
        } else if (!actionUrl) {
          clickAction = '/dashboard';
        }

        await sendFCMNotificationToUser(
          userId,
          {
            title: validTitle,
            body: validMessage,
            icon: '/favicon-1.png'
          },
          {
            // 🔧 EXPERT - Données enrichies comme socket.io
            notification_id: notification.id ? notification.id.toString() : undefined,
            user_id: userId.toString(),
            type: validType,
            category: validCategory,
            action_url: actionUrl || '',
            click_action: clickAction,
            created_at: notification.created_at ? notification.created_at.toISOString() : new Date().toISOString(),
            title: validTitle, // Répété pour compatibilité
            message: validMessage // Répété pour compatibilité
          }
        );
        console.log(`✅ Firebase FCM Push envoyé à user ${userId}: ${validTitle} → ${clickAction}`);
      } catch (fcmError) {
        console.error(`❌ Erreur Firebase FCM async pour user ${userId}:`, fcmError.message);
      }
    });

    console.log(`📬 Notification créée pour user ${userId}: ${validTitle}`);
    return notification;
  } catch (error) {
    console.error('Erreur création notification:', error);
    throw error;
  }
};

/**
 * Crée des notifications pour plusieurs utilisateurs
 */
export const createBulkNotifications = async (
  userIds,
  title,
  message,
  type = 'info',
  category = 'system',
  actionUrl = null,
  io = null
) => {
  const promises = userIds.map(userId =>
    createNotification(userId, title, message, type, category, actionUrl, io)
  );
  
  try {
    return await Promise.all(promises);
  } catch (error) {
    console.error('Erreur création notifications bulk:', error);
    throw error;
  }
};

/**
 * Notifications prédéfinies pour les événements courants
 */
export const NotificationTemplates = {
  // Vérification d'identité
  identityApproved: (userId, io) => createNotification(
    userId,
    '✅ Identité vérifiée',
    'Votre identité a été approuvée avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités.',
    'success',
    'verification',
    null,
    io
  ),

  identityRejected: (userId, reason, io) => createNotification(
    userId,
    '❌ Vérification refusée',
    `Votre demande de vérification a été rejetée. Raison: ${reason}`,
    'error',
    'verification',
    '/verify-identity',
    io
  ),

  // Compte
  welcome: (userId, role, io) => createNotification(
    userId,
    '🎉 Bienvenue sur NettmobFrance !',
    'Votre compte a été créé avec succès ! Complétez votre profil et vérifiez votre identité pour accéder à toutes les fonctionnalités.',
    'success',
    'account',
    `/${role}/profile`,
    io
  ),

  identityVerificationRequest: (userId, role, io) => createNotification(
    userId,
    '🆔 Vérification d\'identité requise',
    `Pour accéder à toutes les fonctionnalités, veuillez vérifier votre identité ${role === 'automob' ? 'd\'auto-entrepreneur' : 'de gérant'}. Documents acceptés : Carte ID, Passeport, Permis.`,
    'warning',
    'verification',
    `/${role}/verify-identity`,
    io
  ),

  emailVerified: (userId, io) => createNotification(
    userId,
    '✅ Email vérifié',
    'Votre adresse email a été vérifiée avec succès.',
    'success',
    'account',
    null,
    io
  ),

  // Missions
  missionCreated: (userId, missionTitle, io) => createNotification(
    userId,
    '🎯 Nouvelle mission',
    `Une nouvelle mission "${missionTitle}" correspond à votre profil.`,
    'info',
    'mission',
    '/missions',
    io
  ),

  missionAccepted: (userId, missionTitle, io) => createNotification(
    userId,
    '✅ Mission acceptée',
    `Votre candidature pour "${missionTitle}" a été acceptée.`,
    'success',
    'mission',
    '/missions',
    io
  ),

  // Messages
  newMessage: (userId, senderName, io) => createNotification(
    userId,
    '💬 Nouveau message',
    `${senderName} vous a envoyé un message.`,
    'info',
    'message',
    '/chat',
    io
  ),

  // Paiements
  paymentReceived: (userId, amount, io) => createNotification(
    userId,
    '💰 Paiement reçu',
    `Vous avez reçu un paiement de ${amount}€.`,
    'success',
    'payment',
    '/wallet',
    io
  ),

  paymentPending: (userId, amount, io) => createNotification(
    userId,
    '⏳ Paiement en attente',
    `Votre paiement de ${amount}€ est en cours de traitement.`,
    'warning',
    'payment',
    '/wallet',
    io
  ),

  // Système
  maintenanceScheduled: (userId, date, io) => createNotification(
    userId,
    '🔧 Maintenance programmée',
    `Une maintenance est prévue le ${date}. Le service sera temporairement indisponible.`,
    'warning',
    'system',
    null,
    io
  ),

  updateAvailable: (userId, io) => createNotification(
    userId,
    '🆕 Mise à jour disponible',
    'Une nouvelle version de la plateforme est disponible. Rechargez la page pour la découvrir.',
    'info',
    'system',
    null,
    io
  )
};

export default {
  createNotification,
  createBulkNotifications,
  NotificationTemplates
};

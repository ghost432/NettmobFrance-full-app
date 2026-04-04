import db from '../config/database.js';
import { sendPushNotification, sendMulticastNotification } from '../config/firebase-admin.js';

/**
 * Récupère les tokens FCM d'un utilisateur
 */
async function getUserFCMTokens(userId) {
  try {
    const [tokens] = await db.query(
      'SELECT token FROM fcm_tokens WHERE user_id = ?',
      [userId]
    );
    return tokens.map(t => t.token);
  } catch (error) {
    console.error('Erreur récupération tokens FCM:', error);
    return [];
  }
}

/**
 * Récupère les tokens FCM de plusieurs utilisateurs
 */
async function getMultipleUsersFCMTokens(userIds) {
  try {
    const [tokens] = await db.query(
      'SELECT token FROM fcm_tokens WHERE user_id IN (?)',
      [userIds]
    );
    return tokens.map(t => t.token);
  } catch (error) {
    console.error('Erreur récupération tokens FCM multiples:', error);
    return [];
  }
}

/**
 * Envoie une notification Firebase à un utilisateur
 */
export async function sendFCMNotificationToUser(userId, notification, data = {}) {
  try {
    const tokens = await getUserFCMTokens(userId);
    
    if (tokens.length === 0) {
      console.log(`⚠️ Aucun token FCM pour l'utilisateur ${userId}`);
      return { success: false, reason: 'no_token' };
    }

    // Envoyer à tous les tokens de l'utilisateur (multi-device)
    const results = await Promise.allSettled(
      tokens.map(token => 
        sendPushNotification(token, notification, data)
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ ${successCount}/${tokens.length} notifications FCM envoyées à l'utilisateur ${userId}`);

    return { success: successCount > 0, successCount, totalTokens: tokens.length };
  } catch (error) {
    console.error('Erreur envoi notification FCM:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une notification Firebase à plusieurs utilisateurs
 */
export async function sendFCMNotificationToMultipleUsers(userIds, notification, data = {}) {
  try {
    const tokens = await getMultipleUsersFCMTokens(userIds);
    
    if (tokens.length === 0) {
      console.log('⚠️ Aucun token FCM trouvé pour les utilisateurs');
      return { success: false, reason: 'no_tokens' };
    }

    const response = await sendMulticastNotification(tokens, notification, data);
    
    console.log(`✅ ${response.successCount}/${tokens.length} notifications FCM envoyées`);

    return { 
      success: response.successCount > 0, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length 
    };
  } catch (error) {
    console.error('Erreur envoi notifications FCM multiples:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une notification pour une nouvelle mission
 */
export async function notifyNewMission(missionId, missionTitle, clientName) {
  try {
    // Récupérer tous les automob avec notifications activées
    const [automobs] = await db.query(`
      SELECT DISTINCT u.id 
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'automob' 
      AND ap.web_push_enabled = 1
      AND u.verified = 1
    `);

    if (automobs.length === 0) {
      console.log('⚠️ Aucun automob à notifier pour la nouvelle mission');
      return;
    }

    const userIds = automobs.map(a => a.id);

    await sendFCMNotificationToMultipleUsers(
      userIds,
      {
        title: '🆕 Nouvelle Mission Disponible',
        body: `${clientName} a publié "${missionTitle}". Cliquez pour voir les détails et postuler !`,
        icon: '/favicon-1.png'
      },
      {
        type: 'new_mission',
        missionId: missionId.toString(),
        click_action: `/automob/missions/${missionId}`
      }
    );

    console.log(`✅ Notification nouvelle mission envoyée à ${automobs.length} automob(s)`);
  } catch (error) {
    console.error('Erreur notification nouvelle mission:', error);
  }
}

/**
 * Envoie une notification pour une nouvelle candidature
 */
export async function notifyNewApplication(clientId, automobName, missionTitle, missionId) {
  try {
    // Valider les paramètres
    const validAutomobName = automobName || 'Un automob';
    const validMissionTitle = missionTitle || 'une mission';
    
    await sendFCMNotificationToUser(
      clientId,
      {
        title: '📝 Nouvelle Candidature',
        body: `${validAutomobName} a postulé pour "${validMissionTitle}". Cliquez pour consulter sa candidature.`,
        icon: '/favicon-1.png'
      },
      {
        type: 'new_application',
        missionId: missionId ? missionId.toString() : undefined,
        click_action: missionId ? `/client/missions/${missionId}` : '/client/applications'
      }
    );

    console.log(`✅ Notification nouvelle candidature envoyée au client ${clientId}`);
  } catch (error) {
    console.error('Erreur notification nouvelle candidature:', error);
  }
}

/**
 * Envoie une notification pour une candidature acceptée
 */
export async function notifyApplicationAccepted(automobId, missionTitle, missionId) {
  try {
    await sendFCMNotificationToUser(
      automobId,
      {
        title: '✅ Candidature Acceptée !',
        body: `Félicitations ! Votre candidature pour "${missionTitle}" a été acceptée. Consultez les détails de la mission.`,
        icon: '/favicon-1.png'
      },
      {
        type: 'application_accepted',
        missionId: missionId ? missionId.toString() : undefined,
        click_action: missionId ? `/automob/missions/${missionId}` : '/automob/my-missions'
      }
    );

    console.log(`✅ Notification candidature acceptée envoyée à l'automob ${automobId}`);
  } catch (error) {
    console.error('Erreur notification candidature acceptée:', error);
  }
}

/**
 * Envoie une notification pour une candidature refusée
 */
export async function notifyApplicationRejected(automobId, missionTitle, missionId) {
  try {
    await sendFCMNotificationToUser(
      automobId,
      {
        title: '❌ Candidature Refusée',
        body: `Votre candidature pour "${missionTitle}" n'a pas été retenue. Continuez à chercher d'autres missions !`,
        icon: '/favicon-1.png'
      },
      {
        type: 'application_rejected',
        missionId: missionId ? missionId.toString() : undefined,
        click_action: '/automob/missions'
      }
    );

    console.log(`✅ Notification candidature refusée envoyée à l'automob ${automobId}`);
  } catch (error) {
    console.error('Erreur notification candidature refusée:', error);
  }
}

/**
 * Envoie une notification pour un nouveau message
 */
export async function notifyNewMessage(recipientId, senderName, preview) {
  try {
    // 🔧 VALIDATION EXPERT - Éviter undefined dans les messages
    const validSenderName = senderName || 'Utilisateur';
    const validPreview = preview || 'Nouveau message reçu';

    // ⚠️ Warning si paramètres undefined détectés
    if (!senderName || !preview) {
      console.warn('🚨 [FCM] Message avec paramètres undefined:', {
        originalSender: senderName,
        originalPreview: preview,
        recipientId,
        fallbackApplied: true
      });
    }

    await sendFCMNotificationToUser(
      recipientId,
      {
        title: `💬 ${validSenderName}`,
        body: validPreview,
        icon: '/favicon-1.png'
      },
      {
        type: 'new_message',
        click_action: '/chat'
      }
    );

    console.log(`✅ Notification nouveau message envoyée à l'utilisateur ${recipientId}`);
  } catch (error) {
    console.error('Erreur notification nouveau message:', error);
  }
}

/**
 * Envoie une notification pour une feuille de temps soumise
 */
export async function notifyTimesheetSubmitted(clientId, automobName, missionTitle, missionId) {
  try {
    // 🔧 VALIDATION EXPERT - Éviter undefined dans les feuilles de temps
    const validAutomobName = automobName || 'Un automob';
    const validMissionTitle = missionTitle || 'une mission';

    // ⚠️ Warning si paramètres undefined détectés
    if (!automobName || !missionTitle) {
      console.warn('🚨 [FCM] Feuille de temps avec paramètres undefined:', {
        originalAutomobName: automobName,
        originalMissionTitle: missionTitle,
        clientId,
        missionId,
        fallbackApplied: true
      });
    }

    await sendFCMNotificationToUser(
      clientId,
      {
        title: '📋 Feuille de Temps Soumise',
        body: `${validAutomobName} a soumis une feuille de temps pour "${validMissionTitle}". Cliquez pour valider.`,
        icon: '/favicon-1.png'
      },
      {
        type: 'timesheet_submitted',
        missionId: missionId ? missionId.toString() : undefined,
        click_action: missionId ? `/client/missions/${missionId}` : '/client/timesheets'
      }
    );

    console.log(`✅ Notification feuille de temps envoyée au client ${clientId}`);
  } catch (error) {
    console.error('Erreur notification feuille de temps:', error);
  }
}

/**
 * Envoie une notification pour une feuille de temps validée
 */
export async function notifyTimesheetApproved(automobId, missionTitle, amount, missionId) {
  try {
    // 🔧 VALIDATION EXPERT - Éviter undefined dans l'approbation
    const validMissionTitle = missionTitle || 'une mission';
    const validAmount = amount || 0;

    // ⚠️ Warning si paramètres undefined détectés
    if (!missionTitle || amount === null || amount === undefined) {
      console.warn('🚨 [FCM] Validation feuille avec paramètres undefined:', {
        originalMissionTitle: missionTitle,
        originalAmount: amount,
        automobId,
        missionId,
        fallbackApplied: true
      });
    }

    await sendFCMNotificationToUser(
      automobId,
      {
        title: '✅ Feuille de Temps Validée',
        body: `Votre feuille de temps pour "${validMissionTitle}" a été validée. Vous allez recevoir ${validAmount}€.`,
        icon: '/favicon-1.png'
      },
      {
        type: 'timesheet_approved',
        missionId: missionId ? missionId.toString() : undefined,
        amount: validAmount.toString(),
        click_action: '/automob/wallet'
      }
    );

    console.log(`✅ Notification validation feuille de temps envoyée à l'automob ${automobId}`);
  } catch (error) {
    console.error('Erreur notification validation feuille de temps:', error);
  }
}

/**
 * Envoie une notification pour un paiement reçu
 */
export async function notifyPaymentReceived(automobId, amount) {
  try {
    // 🔧 VALIDATION EXPERT - Éviter undefined dans les paiements
    const validAmount = amount || 0;

    // ⚠️ Warning si paramètres undefined détectés
    if (amount === null || amount === undefined) {
      console.warn('🚨 [FCM] Paiement avec montant undefined:', {
        originalAmount: amount,
        automobId,
        fallbackApplied: true
      });
    }

    await sendFCMNotificationToUser(
      automobId,
      {
        title: '💰 Paiement Reçu',
        body: `Félicitations ! Vous avez reçu un paiement de ${validAmount}€. Consultez votre portefeuille.`,
        icon: '/favicon-1.png'
      },
      {
        type: 'payment_received',
        amount: validAmount.toString(),
        click_action: '/automob/wallet'
      }
    );

    console.log(`✅ Notification paiement envoyée à l'automob ${automobId}`);
  } catch (error) {
    console.error('Erreur notification paiement:', error);
  }
}

/**
 * Envoie une notification pour une vérification d'identité approuvée
 */
export async function notifyIdentityVerified(userId) {
  try {
    await sendFCMNotificationToUser(
      userId,
      {
        title: '✅ Identité Vérifiée',
        body: 'Votre identité a été vérifiée avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités.',
        icon: '/favicon-1.png'
      },
      {
        type: 'identity_verified',
        click_action: '/dashboard'
      }
    );

    console.log(`✅ Notification vérification identité envoyée à l'utilisateur ${userId}`);
  } catch (error) {
    console.error('Erreur notification vérification identité:', error);
  }
}

export default {
  sendFCMNotificationToUser,
  sendFCMNotificationToMultipleUsers,
  notifyNewMission,
  notifyNewApplication,
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyNewMessage,
  notifyTimesheetSubmitted,
  notifyTimesheetApproved,
  notifyPaymentReceived,
  notifyIdentityVerified
};

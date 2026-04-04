import api from '@/lib/api';
import { requestNotificationPermission } from '@/config/firebase';

/**
 * Enregistre le token FCM auprès du backend
 */
export const registerFCMToken = async (fcmToken) => {
  try {
    await api.post('/fcm/fcm-token', { fcmToken });
    console.log('✅ Token FCM enregistré au backend');
    return true;
  } catch (error) {
    console.error('❌ Erreur enregistrement token FCM:', error);
    return false;
  }
};

/**
 * Vérifie et enregistre le token FCM en attente après l'inscription
 */
export const registerPendingFCMToken = async () => {
  try {
    const pendingToken = localStorage.getItem('pendingFCMToken');
    
    if (pendingToken) {
      console.log('🔑 Token FCM en attente trouvé, enregistrement...');
      const success = await registerFCMToken(pendingToken);
      
      if (success) {
        localStorage.removeItem('pendingFCMToken');
        console.log('✅ Token FCM en attente enregistré et supprimé du localStorage');
      }
      
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erreur enregistrement token FCM en attente:', error);
    return false;
  }
};

/**
 * Active les notifications push Firebase pour l'utilisateur connecté
 */
export const enablePushNotifications = async () => {
  try {
    console.log('🔔 Activation des notifications push...');
    
    // Demander la permission et obtenir le token FCM
    const fcmToken = await requestNotificationPermission();
    
    if (!fcmToken) {
      throw new Error('Impossible d\'obtenir le token FCM');
    }
    
    console.log('🔑 Token FCM obtenu');
    
    // Enregistrer le token auprès du backend
    const success = await registerFCMToken(fcmToken);
    
    if (!success) {
      throw new Error('Échec de l\'enregistrement du token');
    }
    
    console.log('✅ Notifications push activées avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur activation notifications push:', error);
    throw error;
  }
};

/**
 * Désactive les notifications push Firebase
 */
export const disablePushNotifications = async () => {
  try {
    console.log('🔕 Désactivation des notifications push...');
    
    await api.delete('/fcm/fcm-token');
    
    console.log('✅ Notifications push désactivées');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur désactivation notifications push:', error);
    throw error;
  }
};

/**
 * Envoie une notification de test
 */
export const sendTestNotification = async () => {
  try {
    console.log('🧪 Envoi notification de test...');
    
    await api.post('/users/send-test-push');
    
    console.log('✅ Notification de test envoyée');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur envoi notification de test:', error);
    throw error;
  }
};

export default {
  registerFCMToken,
  registerPendingFCMToken,
  enablePushNotifications,
  disablePushNotifications,
  sendTestNotification
};

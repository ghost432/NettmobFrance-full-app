import { requestNotificationPermission as requestFCMPermission, setupMessageListener, isFirebaseConfigured, vapidKey, firebaseConfig } from '@/config/firebase';
import api from '@/lib/api';

/**
 * Vérifier si les notifications push sont supportées
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'Notification' in window && isFirebaseConfigured();
}

/**
 * Enregistrer le Service Worker Firebase
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Les Service Workers ne sont pas supportés par ce navigateur');
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    console.log('✅ Service Worker Firebase enregistré:', registration);

    // Gérer les mises à jour du service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🔄 Nouvelle version du Service Worker détectée');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('✨ Nouvelle version disponible, rafraîchissement recommandé');
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('❌ Erreur enregistrement Service Worker:', error);
    throw error;
  }
}

/**
 * S'abonner aux notifications push avec Firebase
 */
export async function subscribeToPush() {
  try {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré. Veuillez ajouter vos clés Firebase dans le fichier .env');
    }

    console.log('🔔 Début de l\'abonnement Firebase...');

    // 1. Enregistrer le Service Worker
    await registerServiceWorker();
    console.log('✅ Service Worker prêt');

    // 2. Demander la permission et récupérer le token FCM
    console.log('🔍 Debug Firebase Config:', {
      projectId: firebaseConfig?.projectId,
      apiKeyPrefix: firebaseConfig?.apiKey ? firebaseConfig.apiKey.substring(0, 5) + '...' : 'undefined',
      vapidKeyPrefix: vapidKey ? vapidKey.substring(0, 5) + '...' : 'undefined'
    });

    const fcmToken = await requestFCMPermission();
    console.log('🔑 Token FCM obtenu');

    // 3. Envoyer le token au backend
    await api.post('/fcm/fcm-token', {
      fcmToken: fcmToken
    });

    console.log('✅ Token FCM enregistré au backend');

    // 4. Écouter les messages en premier plan
    setupForegroundMessageListener();

    return fcmToken;

  } catch (error) {
    console.error('❌ Erreur souscription Firebase:', error);

    // Messages d'erreur plus explicites
    if (error.message.includes('Permission')) {
      throw new Error('Permission de notification refusée. Veuillez autoriser les notifications dans les paramètres du navigateur.');
    } else if (error.message.includes('Firebase')) {
      throw new Error('Erreur de configuration Firebase. Veuillez contacter le support.');
    }

    throw error;
  }
}

/**
 * Configure l'écoute des messages en premier plan
 */
function setupForegroundMessageListener() {
  console.log('🎧 Configuration de l\'écoute des messages en premier plan...');

  const unsubscribe = setupMessageListener((payload) => {
    console.log('📬 Message reçu en premier plan:', payload);

    // Afficher une notification locale
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationTitle = payload.notification?.title || 'NettmobFrance';
      const notificationOptions = {
        body: payload.notification?.body || 'Vous avez une nouvelle notification',
        icon: payload.notification?.icon || '/favicon-1.png',
        badge: '/favicon-1.png',
        tag: payload.data?.tag || 'notification',
        data: payload.data,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        // Ajouter un timestamp pour forcer l'affichage
        timestamp: Date.now()
      };

      console.log('🔔 Affichage de la notification:', notificationTitle);
      new Notification(notificationTitle, notificationOptions);
    } else {
      console.warn('⚠️ Impossible d\'afficher la notification - Permission:', Notification.permission);
    }
  });

  console.log('✅ Écoute des messages en premier plan activée');
  return unsubscribe;
}

/**
 * Se désabonner des notifications push
 */
export async function unsubscribeFromPush() {
  try {
    // Informer le backend
    await api.delete('/fcm/fcm-token');
    console.log('✅ Token FCM supprimé du backend');

    return true;
  } catch (error) {
    console.error('❌ Erreur désabonnement:', error);
    throw error;
  }
}

/**
 * Vérifier l'état de la souscription
 */
export async function checkSubscription() {
  try {
    if (!isPushSupported()) {
      return null;
    }

    const response = await api.get('/fcm/fcm-token/status');
    return response.data.hasToken ? { active: true } : null;
  } catch (error) {
    console.error('❌ Erreur vérification souscription:', error);
    return null;
  }
}

/**
 * Envoyer une notification de test
 */
export async function sendTestNotification() {
  try {
    await api.post('/users/send-test-push');
    console.log('✅ Notification de test envoyée');
  } catch (error) {
    console.error('❌ Erreur envoi test:', error);
    throw error;
  }
}

export default {
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  checkSubscription,
  sendTestNotification
};

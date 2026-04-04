import api from '@/lib/api';

const VAPID_PUBLIC_KEY = 'BKNAHqov_9DETgh_h87mZgWBGwrjlZZipaZYjKm9TGZEoQ6mKqGP0D9yjOwRQqVckSDKPmRJ4J37FG01SZrMUjE';

/**
 * Convertir une clé publique VAPID en Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Vérifier si les Web Push sont supportés
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Enregistrer le Service Worker
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) {
    throw new Error('Les notifications push ne sont pas supportées par ce navigateur');
  }

  try {
    // 🚫 DÉSACTIVÉ - Conflit avec firebase-messaging-sw.js
    // Utiliser firebasePushNotification.js à la place pour Firebase FCM
    console.warn('⚠️ Service VAPID désactivé pour éviter conflit avec Firebase FCM');
    return null; // Service désactivé
    
    /*
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    */
    
    console.log('[Push] Service Worker enregistré:', registration);
    
    // Gérer les mises à jour du service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[Push] Nouvelle version du Service Worker détectée');
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[Push] Nouvelle version disponible, rafraîchissement recommandé');
        }
      });
    });
    
    return registration;
  } catch (error) {
    console.error('[Push] Erreur enregistrement Service Worker:', error);
    throw error;
  }
}

/**
 * Demander la permission de notification
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Les notifications ne sont pas supportées');
  }

  const permission = await Notification.requestPermission();
  console.log('[Push] Permission:', permission);
  
  if (permission !== 'granted') {
    throw new Error('Permission refusée');
  }

  return permission;
}

/**
 * S'abonner aux notifications push avec VAPID
 * Utilise la clé publique VAPID pour créer une souscription sécurisée
 */
export async function subscribeToPush() {
  try {
    console.log('[Push] Début de l\'abonnement avec VAPID');
    
    // 1. Demander la permission
    await requestNotificationPermission();

    // 2. Obtenir le Service Worker
    const registration = await navigator.serviceWorker.ready;
    console.log('[Push] Service Worker prêt');

    // 3. Vérifier si déjà abonné
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[Push] Déjà abonné, réutilisation de la souscription existante');
      
      // Envoyer quand même au backend pour s'assurer qu'elle est enregistrée
      try {
        await api.post('/users/push-subscription', {
          subscription: JSON.stringify(subscription)
        });
        console.log('[Push] Souscription existante synchronisée avec le backend');
      } catch (error) {
        console.warn('[Push] Erreur synchronisation:', error.message);
      }
      
      return subscription;
    }

    // 4. S'abonner avec la clé VAPID
    console.log('[Push] Création nouvelle souscription avec VAPID...');
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('[Push] Nouvelle souscription créée:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      keys: Object.keys(subscription.toJSON().keys)
    });

    // 5. Envoyer la souscription au backend
    await api.post('/users/push-subscription', {
      subscription: JSON.stringify(subscription)
    });

    console.log('[Push] Souscription envoyée et enregistrée au backend');
    return subscription;

  } catch (error) {
    console.error('[Push] Erreur souscription:', error);
    
    // Messages d'erreur plus explicites
    if (error.message.includes('Permission')) {
      throw new Error('Permission de notification refusée. Veuillez autoriser les notifications dans les paramètres du navigateur.');
    } else if (error.message.includes('VAPID')) {
      throw new Error('Erreur de configuration VAPID. Veuillez contacter le support.');
    }
    
    throw error;
  }
}

/**
 * Se désabonner des notifications push
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] Désabonné');

      // Informer le backend
      await api.delete('/users/push-subscription');
    }

    return true;
  } catch (error) {
    console.error('[Push] Erreur désabonnement:', error);
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

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return subscription;
  } catch (error) {
    console.error('[Push] Erreur vérification souscription:', error);
    return null;
  }
}

/**
 * Envoyer une notification de test
 */
export async function sendTestNotification() {
  try {
    await api.post('/users/send-test-push');
    console.log('[Push] Notification de test envoyée');
  } catch (error) {
    console.error('[Push] Erreur envoi test:', error);
    throw error;
  }
}

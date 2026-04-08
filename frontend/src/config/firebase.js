import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

// Configuration Firebase — valeurs via variables d'environnement UNIQUEMENT
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Clé VAPID publique pour les notifications push
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Initialiser Firebase
let app;
let messaging = null;
let analytics = null;

try {
  app = initializeApp(firebaseConfig);

  // Initialiser Firebase Messaging (uniquement dans le navigateur)
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
    // Analytics désactivé en dev : déclenche des requêtes Installations bloquées sur localhost
    if (!import.meta.env.DEV) {
      analytics = getAnalytics(app);
    }
  }
} catch (error) {
  console.error('Erreur initialisation Firebase:', error);
}

/**
 * Détecte si l'app est une PWA installée
 */
export const isPWAInstalled = () => {
  // Détection basée sur le mode display de la PWA
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const iosStandalone = window.navigator.standalone === true;

  return standalone || (ios && iosStandalone);
};

/**
 * Détecte si c'est un mobile
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Demande la permission de notification et récupère le token FCM
 */
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      throw new Error('Firebase Messaging non disponible');
    }

    // Vérifier si les notifications sont supportées
    if (!('Notification' in window)) {
      throw new Error('Les notifications ne sont pas supportées par ce navigateur');
    }

    // Détection de l'environnement
    const mobile = isMobile();
    const pwa = isPWAInstalled();
    console.log(`📱 Environnement: ${mobile ? 'Mobile' : 'Desktop'} / ${pwa ? 'PWA Installée' : 'Navigateur Web'}`);

    // Vérifier la permission actuelle
    const currentPermission = Notification.permission;
    console.log(`🔔 Permission actuelle: ${currentPermission}`);

    // Demander la permission
    const permission = await Notification.requestPermission();
    console.log(`🔔 Nouvelle permission: ${permission}`);

    if (permission === 'granted') {
      console.log('✅ Permission de notification accordée');
      console.log('📱 Les notifications apparaîtront:', {
        mobile: mobile ? '✅ Sur l\'écran mobile / barre de notification' : '❌',
        pwa: pwa ? '✅ Sur l\'icône PWA avec badge' : '❌',
        desktop: !mobile ? '✅ En notification système' : '❌'
      });

      // Enregistrer le Service Worker manuellement avant de récupérer le token
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('✅ Service Worker enregistré:', registration.scope);
        console.log('📂 Service Worker state:', registration.active?.state || 'installing');

        // Attendre que le SW soit actif
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker prêt et actif');
      } catch (swError) {
        console.error('❌ Erreur enregistrement SW:', swError);
        // Continuer quand même, Firebase va essayer de l'enregistrer
      }

      // Récupérer le token FCM
      console.log('🔑 Récupération du token FCM...');

      // En développement localhost, Firebase bloque les requêtes Installations
      if (import.meta.env.DEV) {
        console.info('ℹ️ FCM token ignoré en développement (localhost bloqué par la clé API Firebase)');
        return null;
      }

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/')
      });
      console.log('✅ Token FCM obtenu:', token.substring(0, 20) + '...');

      return token;
    } else if (permission === 'denied') {
      console.log('❌ Permission de notification refusée par l\'utilisateur');
      console.warn('⚠️ Pour activer les notifications:');
      if (mobile) {
        console.warn('   Mobile: Paramètres → Applications → Navigateur → Notifications → Autoriser');
      } else {
        console.warn('   Desktop: Cliquer sur l\'icône 🔒 dans la barre d\'adresse → Notifications → Autoriser');
      }
      throw new Error('Permission de notification refusée');
    } else {
      console.log('⏸️ Permission de notification en attente (utilisateur a ignoré)');
      throw new Error('Permission de notification non accordée');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la demande de permission:', error);
    throw error;
  }
};

/**
 * Écoute les messages en premier plan (écoute continue)
 */
export const setupMessageListener = (callback) => {
  if (!messaging) {
    console.warn('Firebase Messaging non disponible');
    return () => { };
  }

  // onMessage écoute en continu, pas besoin de Promise
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('📬 Message reçu en premier plan:', payload);
    callback(payload);
  });

  return unsubscribe;
};

/**
 * Écoute les messages en premier plan (version Promise - dépréciée, gardée pour compatibilité)
 * @deprecated Utiliser setupMessageListener à la place
 */
export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) {
      console.warn('Firebase Messaging non disponible');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('📬 Message reçu en premier plan:', payload);
      resolve(payload);
    });
  });
};

/**
 * Vérifie si Firebase est configuré
 */
export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey && !!vapidKey;
};

export { messaging, vapidKey, firebaseConfig };
export default app;

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;

/**
 * Initialise Firebase Admin SDK
 */
export const initializeFirebase = () => {
  try {
    // Vérifier si déjà initialisé
    if (firebaseApp) {
      return firebaseApp;
    }

    let source = 'file:config';
    let serviceAccount = null;

    // 1) Base64 dans l'env
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        const jsonStr = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(jsonStr);
        source = 'env:BASE64';
      } catch (e) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT_BASE64 invalide:', e.message);
      }
    }

    // 2) JSON brut dans l'env
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        source = 'env:JSON';
      } catch (e) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON invalide:', e.message);
      }
    }

    // 3) GOOGLE_APPLICATION_CREDENTIALS (chemin absolu)
    if (!serviceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const gacPath = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        ? process.env.GOOGLE_APPLICATION_CREDENTIALS
        : path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
      if (fs.existsSync(gacPath)) {
        try {
          const raw = fs.readFileSync(gacPath, 'utf8');
          serviceAccount = JSON.parse(raw);
          source = 'env:GAC_PATH';
        } catch (e) {
          console.error('❌ GOOGLE_APPLICATION_CREDENTIALS illisible:', e.message);
        }
      }
    }

    // 4) Fichier local par défaut
    if (!serviceAccount) {
      const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
      if (fs.existsSync(serviceAccountPath)) {
        try {
          const raw = fs.readFileSync(serviceAccountPath, 'utf8');
          serviceAccount = JSON.parse(raw);
          source = 'file:config';
        } catch (e) {
          console.error('❌ Clé Firebase locale illisible:', e.message);
        }
      }
    }

    if (!serviceAccount) {
      console.warn('⚠️ Aucune clé de service Firebase fournie');
      console.warn('📝 Configurez FIREBASE_SERVICE_ACCOUNT_BASE64 ou FIREBASE_SERVICE_ACCOUNT_JSON,');
      console.warn('   ou définissez GOOGLE_APPLICATION_CREDENTIALS, ou placez firebase-service-account.json dans config/.');
      return null;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId
    });

    console.log(`✅ Firebase Admin initialisé (${source}) pour projet: ${projectId || 'inconnu'}`);
    return firebaseApp;
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin:', error);
    return null;
  }
};

/**
 * Envoie une notification push via FCM
 * @param {string} token - Token FCM de l'utilisateur
 * @param {object} notification - Contenu de la notification
 * @param {object} data - Données additionnelles
 */
export const sendPushNotification = async (token, notification, data = {}) => {
  try {
    if (!firebaseApp) {
      console.warn('⚠️ Firebase Admin non initialisé');
      return null;
    }

    // 🔧 VALIDATION EXPERT - Éviter les notifications undefined
    const validatedNotification = {
      title: notification?.title || 'NettmobFrance',
      body: notification?.body || 'Nouvelle notification'
    };

    // ⚠️ Warning si paramètres undefined détectés
    if (!notification?.title || !notification?.body) {
      console.warn('🚨 [FCM] Notification avec paramètres undefined détectés:', {
        originalTitle: notification?.title,
        originalBody: notification?.body,
        fallbackApplied: true
      });
    }

    // Convertir toutes les données en strings (requis par Firebase)
    const stringifiedData = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined) {
        stringifiedData[key] = String(value);
      }
    });

    const message = {
      notification: validatedNotification,
      data: {
        ...stringifiedData,
        click_action: String(data.click_action || '/'),
        timestamp: new Date().toISOString()
      },
      token: token,
      webpush: {
        fcmOptions: {
          link: data.click_action || '/'
        },
        notification: {
          icon: notification?.icon || '/favicon-1.png',
          badge: '/favicon-1.png',
          vibrate: [200, 100, 200],
          requireInteraction: false
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification envoyée avec succès:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
    throw error;
  }
};

/**
 * Envoie une notification à plusieurs utilisateurs
 * @param {string[]} tokens - Liste des tokens FCM
 * @param {object} notification - Contenu de la notification
 * @param {object} data - Données additionnelles
 */
export const sendMulticastNotification = async (tokens, notification, data = {}) => {
  try {
    if (!firebaseApp) {
      console.warn('⚠️ Firebase Admin non initialisé');
      return null;
    }

    if (!tokens || tokens.length === 0) {
      console.warn('⚠️ Aucun token fourni');
      return null;
    }

    // 🔧 VALIDATION EXPERT - Éviter les notifications undefined
    const validatedNotification = {
      title: notification?.title || 'NettmobFrance',
      body: notification?.body || 'Nouvelle notification'
    };

    // ⚠️ Warning si paramètres undefined détectés
    if (!notification?.title || !notification?.body) {
      console.warn('🚨 [FCM MULTICAST] Notification avec paramètres undefined détectés:', {
        originalTitle: notification?.title,
        originalBody: notification?.body,
        fallbackApplied: true,
        tokensCount: tokens.length
      });
    }

    // Convertir toutes les données en strings (requis par Firebase)
    const stringifiedData = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined) {
        stringifiedData[key] = String(value);
      }
    });

    const message = {
      notification: validatedNotification,
      data: {
        ...stringifiedData,
        click_action: String(data.click_action || '/'),
        timestamp: new Date().toISOString()
      },
      tokens: tokens,
      webpush: {
        fcmOptions: {
          link: data.click_action || '/'
        },
        notification: {
          icon: notification?.icon || '/favicon-1.png',
          badge: '/favicon-1.png',
          vibrate: [200, 100, 200],
          requireInteraction: false
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ ${response.successCount}/${tokens.length} notifications envoyées`);
    
    if (response.failureCount > 0) {
      console.warn(`⚠️ ${response.failureCount} échecs:`, response.responses
        .filter(r => !r.success)
        .map(r => r.error?.message)
      );
    }
    
    return response;
  } catch (error) {
    console.error('❌ Erreur envoi notifications multicast:', error);
    throw error;
  }
};

/**
 * Vérifie si un token FCM est valide
 * @param {string} token - Token FCM à vérifier
 */
export const validateFCMToken = async (token) => {
  try {
    if (!firebaseApp) {
      return false;
    }

    // Essayer d'envoyer un message de test (dry run)
    await admin.messaging().send({
      token: token,
      data: { test: 'true' }
    }, true); // dry run = true

    return true;
  } catch (error) {
    console.error('Token invalide:', error.message);
    return false;
  }
};

export default { initializeFirebase, sendPushNotification, sendMulticastNotification, validateFCMToken };

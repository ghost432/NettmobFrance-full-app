import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Initialiser le client Twilio
let twilioClient = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio initialisé avec succès');
    console.log(`📋 Account SID: ${process.env.TWILIO_ACCOUNT_SID}`);
    console.log(`📋 Messaging Service: ${process.env.TWILIO_MESSAGING_SERVICE_SID || 'Non configuré'}`);
    console.log(`📋 Phone Number: ${process.env.TWILIO_PHONE_NUMBER || 'Non configuré'}`);

    // Test de connectivité (optionnel)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Test de connectivité Twilio...');
    }
  } else {
    console.warn('⚠️ Twilio non configuré - vérifiez vos variables d\'environnement');
    console.warn(`   TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Défini' : 'Manquant'}`);
    console.warn(`   TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? 'Défini' : 'Manquant'}`);
  }
} catch (error) {
  console.error('❌ Erreur initialisation Twilio:', error);
}

/**
 * Formater un numéro de téléphone au format international
 * Supporte France (+33) et Cameroun (+237)
 */
const formatPhoneNumber = (phone, countryCode = '+33') => {
  if (!phone) return null;

  // Supprimer tous les espaces et caractères spéciaux sauf +
  let formatted = phone.replace(/[^\d+]/g, '');

  // Si déjà au format international, retourner tel quel
  if (formatted.startsWith('+33') || formatted.startsWith('+237')) {
    return formatted;
  }

  // Détection automatique du pays selon la longueur et le format
  if (formatted.startsWith('0') && formatted.length === 10) {
    // Format français: 0X XX XX XX XX → +33X XX XX XX XX
    formatted = '+33' + formatted.substring(1);
  } else if (formatted.startsWith('6') && formatted.length === 9) {
    // Format camerounais mobile: 6XX XXX XXX → +237 6XX XXX XXX
    formatted = '+237' + formatted;
  } else if (formatted.startsWith('2') && formatted.length === 9) {
    // Format camerounais fixe: 2XX XXX XXX → +237 2XX XXX XXX  
    formatted = '+237' + formatted;
  } else if (formatted.length === 9 && /^[67]/.test(formatted)) {
    // Numéros camerounais commençant par 6 ou 7
    formatted = '+237' + formatted;
  } else if (formatted.length === 8 && countryCode === '+33') {
    // Numéros français sans le 0 initial
    formatted = '+33' + formatted;
  } else if (!formatted.startsWith('+')) {
    // Utiliser le code pays fourni par défaut
    formatted = countryCode + formatted;
  }

  console.log(`📞 Format numéro: ${phone} → ${formatted}`);
  return formatted;
};

/**
 * Simuler l'envoi SMS en mode développement
 */
const simulateSMS = (to, message) => {
  console.log(`📱 [SIMULATION SMS] Envoi simulé à ${to}`);
  console.log(`📝 Message: ${message}`);
  console.log(`⚠️ SMS non envoyé - Mode simulation (problème connectivité Twilio)`);

  return {
    success: true,
    sid: `SIM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    to: to,
    status: 'simulated',
    simulated: true
  };
};

/**
 * Envoyer un SMS via Twilio
 * @param {string} to - Numéro de téléphone du destinataire
 * @param {string} message - Message à envoyer
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
export const sendSMS = async (to, message, countryCode = '+33') => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio non configuré');
    }

    const formattedPhone = formatPhoneNumber(to, countryCode);

    if (!formattedPhone) {
      throw new Error('Numéro de téléphone invalide');
    }

    // Utiliser le Messaging Service ID, sinon Alphanumeric Sender ID, sinon le numéro from
    const messageOptions = {
      body: message,
      to: formattedPhone
    };

    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      // Option 1: Messaging Service (recommandé - gère plusieurs pays)
      messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else if (process.env.TWILIO_ALPHA_SENDER_ID) {
      // Option 2: Alphanumeric Sender ID direct (ex: "NettmobFrance")
      messageOptions.from = process.env.TWILIO_ALPHA_SENDER_ID;
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      // Option 3: Numéro de téléphone classique
      messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
    } else {
      throw new Error('Aucun expéditeur Twilio configuré (Messaging Service, Alpha Sender ou Phone Number)');
    }

    console.log(`📤 Envoi SMS à ${formattedPhone}...`);
    console.log(`📋 Options d'envoi:`, {
      to: messageOptions.to,
      from: messageOptions.from || 'Messaging Service',
      messagingServiceSid: messageOptions.messagingServiceSid || 'Non utilisé',
      bodyLength: messageOptions.body.length
    });

    // Promesse avec timeout pour éviter les blocages
    const sendPromise = twilioClient.messages.create(messageOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout SMS (15s)')), 15000)
    );

    const result = await Promise.race([sendPromise, timeoutPromise]);

    console.log(`✅ SMS envoyé à ${formattedPhone}: ${result.sid} (${result.status})`);

    return {
      success: true,
      sid: result.sid,
      to: formattedPhone,
      status: result.status
    };
  } catch (error) {
    console.error(`❌ Erreur envoi SMS à ${to}:`, error.message);
    console.error(`   Code erreur:`, error.code || 'Aucun code');
    console.error(`   Status:`, error.status || 'Aucun status');
    console.error(`   Stack:`, error.stack);

    // Messages d'erreur détaillés
    let errorDetail = error.message || 'Erreur inconnue';
    if (error.code === 21211) {
      errorDetail = 'Numéro invalide ou non vérifié (code: 21211)';
    } else if (error.code === 21408) {
      errorDetail = 'Permission refusée - Vérifiez numéro dans Twilio Console (code: 21408)';
    } else if (error.code === 21614) {
      errorDetail = 'Numéro non vérifié - Compte Twilio en mode test (code: 21614)';
    } else if (error.code === 20003) {
      errorDetail = 'Authentification échouée - Vérifiez vos credentials (code: 20003)';
    } else if (error.message === 'Timeout SMS (15s)') {
      errorDetail = 'Timeout - Twilio ne répond pas (15s)';
    } else if (error.code === 'ETIMEDOUT') {
      errorDetail = 'Timeout réseau - Problème de connectivité vers Twilio';
    } else if (error.code === 'ENOTFOUND') {
      errorDetail = 'DNS Error - Impossible de résoudre api.twilio.com';
    } else if (error.code === 'ECONNREFUSED') {
      errorDetail = 'Connexion refusée - Firewall ou proxy bloquant';
    } else if (error.code === 21608) {
      errorDetail = 'Numéro désactivé ou opt-out (code: 21608)';
    } else if (error.code === 21610) {
      errorDetail = 'Numéro blacklisté (code: 21610)';
    }

    console.error(`   Détails: ${errorDetail}`);

    // En cas d'erreur réseau, utiliser la simulation en mode développement
    if ((error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') &&
      process.env.NODE_ENV !== 'production') {
      console.log(`🔄 [SMS] Basculement en mode simulation pour ${to}`);
      return simulateSMS(formattedPhone, message);
    }

    return {
      success: false,
      error: errorDetail,
      errorCode: error.code,
      to: to
    };
  }
};

/**
 * Envoyer un SMS à plusieurs destinataires
 * @param {string[]} phoneNumbers - Liste de numéros de téléphone
 * @param {string} message - Message à envoyer
 * @returns {Promise<Object>} - Statistiques d'envoi
 */
export const sendBulkSMS = async (phoneNumbers, message) => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio non configuré');
    }

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return {
        total: 0,
        success: 0,
        failed: 0,
        errors: [],
        message: 'Aucun numéro fourni'
      };
    }

    console.log(`📱 Envoi SMS groupé démarré: ${phoneNumbers.length} destinataires`);

    const results = {
      total: phoneNumbers.length,
      success: 0,
      failed: 0,
      errors: [],
      details: []
    };

    // Envoi séquentiel pour éviter la surcharge
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phone = phoneNumbers[i];
      try {
        const result = await sendSMS(phone, message);
        if (result.success) {
          results.success++;
          results.details.push({
            phone: result.to,
            status: 'success',
            sid: result.sid
          });
        } else {
          results.failed++;
          results.errors.push({
            phone,
            error: result.error
          });
          results.details.push({
            phone,
            status: 'failed',
            error: result.error
          });
        }

        // Petite pause pour éviter le rate limiting
        if (i < phoneNumbers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          phone,
          error: error.message
        });
        results.details.push({
          phone,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log(`📊 Envoi groupé terminé: ${results.success}/${results.total} réussis`);
    if (results.failed > 0) {
      console.warn(`⚠️ ${results.failed} SMS ont échoué:`, results.errors);
    }

    return results;
  } catch (error) {
    console.error('❌ Erreur envoi SMS groupé:', error);
    return {
      total: phoneNumbers?.length || 0,
      success: 0,
      failed: phoneNumbers?.length || 0,
      errors: [{ error: error.message }],
      details: []
    };
  }
};

/**
 * Notifier par SMS une nouvelle mission
 * @param {string} phone - Numéro du destinataire
 * @param {Object} mission - Données de la mission
 */
export const notifyMissionBySMS = async (phone, mission) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://pro.nettmobfrance.fr';
  const message = `🎯 Nouvelle mission disponible !\n${mission.mission_name}\n💰 ${mission.hourly_rate}€/h\n📍 ${mission.city}\nConsultes vite: ${frontendUrl}/automob/missions/${mission.id}`;

  return await sendSMS(phone, message);
};

/**
 * Notifier par SMS l'acceptation d'une candidature
 * @param {string} phone - Numéro du destinataire
 * @param {Object} data - Données de la notification
 */
export const notifyApplicationAcceptedBySMS = async (phone, data) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://pro.nettmobfrance.fr';
  const message = `✅ Candidature acceptée !\nVotre candidature pour "${data.missionTitle}" a été acceptée.\nConsultez les détails: ${frontendUrl}/automob/missions/${data.missionId}`;

  return await sendSMS(phone, message);
};

/**
 * Vérifier la configuration Twilio
 * @returns {Object} - Statut de la configuration
 */
export const checkTwilioConfig = () => {
  return {
    configured: !!twilioClient,
    hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasMessagingService: !!process.env.TWILIO_MESSAGING_SERVICE_SID,
    hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER
  };
};

export default {
  sendSMS,
  sendBulkSMS,
  notifyMissionBySMS,
  notifyApplicationAcceptedBySMS,
  checkTwilioConfig,
  formatPhoneNumber
};

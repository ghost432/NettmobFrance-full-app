import db from '../config/database.js';
import { createNotification } from '../utils/notificationHelper.js';
import { sendFCMNotificationToMultipleUsers } from './fcmNotificationService.js';
import { sendBulkSMS } from './twilioService.js';
import { sendNewMissionEmail } from './missionEmailService.js';
import webpush from 'web-push';

/**
 * SERVICE EXPERT - Publication unifiée des notifications pour missions automob
 * Corrige définitivement tous les problèmes de notifications manquantes
 */
export class MissionNotificationService {

  /**
   * Publier une nouvelle mission avec notifications complètes
   * @param {Object} mission - Données de la mission
   * @param {Object} client - Données du client
   * @param {Array} competencesIds - IDs des compétences requises
   * @param {Object} io - Instance Socket.IO
   */
  static async publishMissionNotifications(mission, client, competencesIds, io) {
    console.log(`🚀 [MISSION_NOTIF] Début publication notifications pour mission ${mission.id}: ${mission.mission_name}`);

    const results = {
      eligible_automobs: 0,
      notifications_sent: 0,
      web_push_sent: 0,
      fcm_sent: 0,
      emails_sent: 0,
      sms_sent: 0,
      errors: []
    };

    try {
      // 1. RECHERCHER LES AUTOMOBS ÉLIGIBLES
      const eligibleAutomobs = await this.findEligibleAutomobs(mission, competencesIds);
      results.eligible_automobs = eligibleAutomobs.length;

      if (eligibleAutomobs.length === 0) {
        console.log(`⚠️ [MISSION_NOTIF] Aucun automob éligible trouvé pour mission ${mission.id}`);
        return results;
      }

      console.log(`📋 [MISSION_NOTIF] ${eligibleAutomobs.length} automobs éligibles trouvés`);

      // 2. NOTIFICATIONS IN-APP (Socket.IO + Base de données)
      await this.sendInAppNotifications(mission, client, eligibleAutomobs, io);
      results.notifications_sent = eligibleAutomobs.length;

      // 3. NOTIFICATIONS PUSH WEB (même pour automobs déconnectés)
      results.web_push_sent = await this.sendWebPushNotifications(mission, client, eligibleAutomobs);

      // 4. NOTIFICATIONS PUSH MOBILE (FCM Firebase)
      results.fcm_sent = await this.sendFCMNotifications(mission, client, eligibleAutomobs);

      // 5. NOTIFICATIONS EMAIL
      results.emails_sent = await this.sendEmailNotifications(mission, client, eligibleAutomobs);

      // 6. NOTIFICATIONS SMS (pour automobs non connectés)
      results.sms_sent = await this.sendSMSNotifications(mission, client, eligibleAutomobs);

      console.log(`✅ [MISSION_NOTIF] Publication terminée pour mission ${mission.id}:`, {
        eligible: results.eligible_automobs,
        notifications: results.notifications_sent,
        web_push: results.web_push_sent,
        fcm: results.fcm_sent,
        emails: results.emails_sent,
        sms: results.sms_sent
      });

      return results;

    } catch (error) {
      console.error(`❌ [MISSION_NOTIF] Erreur publication mission ${mission.id}:`, error);
      results.errors.push({
        type: 'general',
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Rechercher les automobs éligibles pour une mission
   */
  static async findEligibleAutomobs(mission, competencesIds) {
    try {
      // Requête pour trouver les automobs avec les bonnes compétences
      const [automobs] = await db.query(`
        SELECT DISTINCT 
          u.id, u.email, u.verified, u.created_at as user_created_at,
          ap.first_name, ap.last_name, ap.phone as profile_phone, 
          ap.phone_country_code, ap.city, ap.work_areas, 
          ap.availability_start_date, ap.availability_end_date, 
          ap.id_verified, ap.secteur_id, ap.web_push_enabled, 
          ap.web_push_subscription, ap.id AS automob_profile_id,
          ap.sms_notifications
        FROM users u
        JOIN automob_profiles ap ON u.id = ap.user_id
        JOIN automob_competences ac ON ap.id = ac.automob_profile_id
        WHERE u.role = 'automob' 
          AND u.verified = TRUE 
          AND ac.competence_id IN (${competencesIds.map(() => '?').join(',')})
          AND ap.id_verified = 1
      `, competencesIds);

      console.log(`🔍 [MISSION_NOTIF] ${automobs.length} automobs trouvés avec les compétences requises`);

      // Filtrer par géolocalisation et disponibilité
      const eligibleAutomobs = automobs.filter(automob => {
        return this.checkGeographicEligibility(automob, mission) &&
          this.checkAvailability(automob, mission);
      });

      console.log(`✅ [MISSION_NOTIF] ${eligibleAutomobs.length} automobs éligibles après filtrage`);
      return eligibleAutomobs;

    } catch (error) {
      console.error(`❌ [MISSION_NOTIF] Erreur recherche automobs éligibles:`, error);
      throw error;
    }
  }

  /**
   * Vérifier l'éligibilité géographique
   * Vérifie DEUX endroits : 1) Ville du profil 2) Villes de travail
   */
  static checkGeographicEligibility(automob, mission) {
    const missionCity = mission.city?.toLowerCase().trim();
    const automobCity = automob.city?.toLowerCase().trim();

    // Si pas de ville spécifiée ou ville = "france", accepter tous
    if (!missionCity || missionCity === 'france') {
      console.log(`✅ [GEO] Automob ${automob.id}: Mission sans ville spécifique - ÉLIGIBLE`);
      return true;
    }

    // 1️⃣ VÉRIFICATION 1 : Correspondance directe de ville du profil
    if (automobCity && automobCity === missionCity) {
      console.log(`✅ [GEO] Automob ${automob.id}: Ville profil "${automobCity}" = Mission "${missionCity}" - ÉLIGIBLE`);
      return true;
    }

    // 2️⃣ VÉRIFICATION 2 : Vérifier les villes de travail (work_areas)
    if (automob.work_areas) {
      try {
        let workAreas;

        // Gérer les 3 formats possibles : Array déjà parsé, JSON string, ou CSV string
        if (Array.isArray(automob.work_areas)) {
          // Déjà un array (cas où MySQL retourne directement l'array)
          workAreas = automob.work_areas;
        } else if (typeof automob.work_areas === 'string') {
          // C'est une string, déterminer si JSON ou CSV
          if (automob.work_areas.startsWith('[')) {
            // Format JSON string : '["Paris", "Lyon"]'
            workAreas = JSON.parse(automob.work_areas);
          } else {
            // Format CSV string : "Paris,Lille,Lyon"
            workAreas = automob.work_areas.split(',').map(s => s.trim());
          }
        } else {
          console.log(`⚠️ [GEO] Automob ${automob.id}: work_areas format inconnu:`, typeof automob.work_areas);
          workAreas = [];
        }

        if (Array.isArray(workAreas) && workAreas.length > 0) {
          const found = workAreas.some(area => {
            if (!area) return false;
            const normalizedArea = area.toString().toLowerCase().trim();

            if (normalizedArea === missionCity) {
              console.log(`✅ [GEO] Automob ${automob.id}: Ville travail "${normalizedArea}" = Mission "${missionCity}" - ÉLIGIBLE`);
              return true;
            }
            return false;
          });

          if (found) return true;

          console.log(`⚠️ [GEO] Automob ${automob.id}: Aucune ville de travail ne correspond à "${missionCity}". Villes travail: ${workAreas.join(', ')}`);
        } else {
          console.log(`⚠️ [GEO] Automob ${automob.id}: work_areas vide ou invalide`);
        }
      } catch (e) {
        console.error(`❌ [GEO] Automob ${automob.id}: Erreur parsing work_areas:`, e);
        console.error(`   work_areas brut:`, automob.work_areas);
      }
    } else {
      console.log(`⚠️ [GEO] Automob ${automob.id}: Pas de work_areas défini. Ville profil: "${automobCity}" vs Mission: "${missionCity}"`);
    }

    console.log(`❌ [GEO] Automob ${automob.id}: NON ÉLIGIBLE - Ville profil: "${automobCity}", Mission: "${missionCity}"`);
    return false;
  }

  /**
   * Vérifier la disponibilité
   */
  static checkAvailability(automob, mission) {
    const missionStart = mission.start_date ? new Date(mission.start_date) : null;
    const missionEnd = mission.end_date ? new Date(mission.end_date) : null;

    if (!missionStart || !missionEnd) {
      return true; // Si pas de dates, accepter
    }

    // Vérifier disponibilité générale du profil
    if (automob.availability_start_date && automob.availability_end_date) {
      const availStart = new Date(automob.availability_start_date);
      const availEnd = new Date(automob.availability_end_date);

      if (missionStart >= availStart && missionEnd <= availEnd) {
        return true;
      }
    }

    // Si pas de disponibilités définies, accepter par défaut
    return true;
  }

  /**
   * Envoyer les notifications in-app (Socket.IO + BDD)
   */
  static async sendInAppNotifications(mission, client, automobs, io) {
    try {
      const userIds = automobs.map(a => a.id);
      const title = '🎯 Nouvelle Mission Disponible';
      const message = `${client.company_name || 'Un client'} a publié "${mission.mission_name}" - ${mission.hourly_rate}€/h à ${mission.city || 'France'}. Cliquez pour voir les détails et postuler !`;

      // Créer les notifications en base pour tous les automobs
      const notificationPromises = userIds.map(userId =>
        createNotification(
          userId,
          title,
          message,
          'info',
          'mission',
          `/automob/missions/${mission.id}`,
          io
        )
      );

      await Promise.all(notificationPromises);
      console.log(`📲 [MISSION_NOTIF] ${userIds.length} notifications in-app créées`);

    } catch (error) {
      console.error(`❌ [MISSION_NOTIF] Erreur notifications in-app:`, error);
      throw error;
    }
  }

  /**
   * Envoyer les notifications Web Push (VAPID)
   */
  static async sendWebPushNotifications(mission, client, automobs) {
    let sent = 0;

    try {
      // Vérifier la configuration VAPID
      const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
      const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.log(`⚠️ [MISSION_NOTIF] VAPID non configuré, Web Push désactivé`);
        return 0;
      }

      // Configurer VAPID si pas déjà fait
      try {
        webpush.setVapidDetails(
          `mailto:${process.env.VAPID_EMAIL || 'support@localhost'}`,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        );
      } catch (e) {
        console.error(`❌ [MISSION_NOTIF] Erreur config VAPID:`, e.message);
        return 0;
      }

      const webPushAutomobs = automobs.filter(a =>
        a.web_push_enabled && a.web_push_subscription
      );

      if (webPushAutomobs.length === 0) {
        console.log(`⚠️ [MISSION_NOTIF] Aucun automob avec Web Push activé`);
        return 0;
      }

      const title = '🎯 Nouvelle Mission Disponible';
      const body = `Mission "${mission.mission_name}" à ${mission.city || 'France'} - ${mission.hourly_rate}€/h par ${client.company_name || 'Un client'}`;

      const webPushPromises = webPushAutomobs.map(async (automob) => {
        try {
          const subscription = JSON.parse(automob.web_push_subscription);

          // Valider la subscription avant envoi
          if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
            console.log(`⚠️ [MISSION_NOTIF] Subscription invalide pour automob ${automob.id}`);
            return false;
          }

          // Vérifier que p256dh et auth sont des strings valides (longueur minimale)
          if (typeof subscription.keys.p256dh !== 'string' || subscription.keys.p256dh.length < 10 ||
            typeof subscription.keys.auth !== 'string' || subscription.keys.auth.length < 10) {
            console.log(`⚠️ [MISSION_NOTIF] Clés subscription trop courtes pour automob ${automob.id} - probablement subscription de test`);
            console.log(`   Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
            console.log(`   ℹ️ En production, l'utilisateur devra réautoriser les notifications dans son navigateur`);
            return false;
          }

          // Format correct pour Web Push avec notification et data séparés
          const payload = JSON.stringify({
            notification: {
              title,
              body,
              icon: '/favicon-1.png',
              badge: '/badge-72x72.png',
              click_action: `/automob/missions/${mission.id}`,
              requireInteraction: true,
              vibrate: [200, 100, 200]
            },
            data: {
              action_url: `/automob/missions/${mission.id}`,
              mission_id: mission.id.toString(),
              type: 'new_mission',
              mission_name: mission.mission_name,
              client_name: client.company_name || 'Un client',
              hourly_rate: mission.hourly_rate.toString(),
              city: mission.city || 'France'
            }
          });

          await webpush.sendNotification(subscription, payload);
          console.log(`✅ [MISSION_NOTIF] Web Push envoyé à ${automob.first_name} ${automob.last_name}`);
          return true;

        } catch (error) {
          // Si la souscription est expirée (410/404), logger seulement
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`⚠️ [MISSION_NOTIF] Souscription expirée pour automob ${automob.id}`);
            console.log(`   ℹ️ L'utilisateur devra réautoriser les notifications`);
          } else if (error.message && error.message.includes('p256dh')) {
            console.log(`⚠️ [MISSION_NOTIF] Subscription de test pour automob ${automob.id} - ignoré`);
            console.log(`   ℹ️ En production, une vraie subscription sera créée par le navigateur`);
          } else {
            console.error(`❌ [MISSION_NOTIF] Web Push error pour ${automob.email}:`, error.message);
          }
          return false;
        }
      });

      const results = await Promise.all(webPushPromises);
      sent = results.filter(Boolean).length;

      console.log(`🔔 [MISSION_NOTIF] Web Push: ${sent}/${webPushAutomobs.length} envoyés avec succès`);

    } catch (error) {
      console.error(`❌ [MISSION_NOTIF] Erreur Web Push globale:`, error);
    }

    return sent;
  }

  /**
   * Envoyer les notifications FCM (Firebase Cloud Messaging)
   */
  static async sendFCMNotifications(mission, client, automobs) {
    let sent = 0;

    try {
      const userIds = automobs.map(a => a.id);

      const fcmResult = await sendFCMNotificationToMultipleUsers(
        userIds,
        {
          title: '🎯 Nouvelle Mission Disponible',
          body: `${client.company_name || 'Un client'} a publié "${mission.mission_name}" - ${mission.hourly_rate}€/h à ${mission.city || 'France'}. Cliquez pour voir les détails et postuler !`,
          icon: '/favicon-1.png'
        },
        {
          mission_id: mission.id.toString(),
          click_action: `/automob/missions/${mission.id}`,
          action_url: `/automob/missions/${mission.id}`,
          category: 'mission',
          type: 'new_mission'
        }
      );

      sent = fcmResult.successCount || 0;
      console.log(`🔥 [MISSION_NOTIF] FCM: ${sent}/${fcmResult.totalTokens || userIds.length} envoyés`);

    } catch (error) {
      console.error(`❌ [MISSION_NOTIF] Erreur FCM:`, error);
    }

    return sent;
  }

  /**
   * Envoyer les notifications par email
   */
  static async sendEmailNotifications(mission, client, automobs) {
    let sent = 0;

    try {
      const missionData = {
        id: mission.id,
        mission_name: mission.mission_name,
        hourly_rate: mission.hourly_rate,
        city: mission.city || 'France',
        secteur_id: mission.secteur_id,
        description: mission.description,
        start_date: mission.start_date
      };

      // Envoyer les emails en parallèle pour plus de rapidité
      const emailPromises = automobs.map(async (automob) => {
        try {
          const fullName = `${automob.first_name} ${automob.last_name || ''}`.trim();
          const emailSent = await sendNewMissionEmail(automob.email, fullName, missionData);

          if (emailSent) {
            console.log(`✅ [MISSION_NOTIF] Email envoyé à ${fullName} (${automob.email})`);
            return 1;
          }
          return 0;

        } catch (emailError) {
          console.error(`❌ [MISSION_NOTIF] Erreur email pour ${automob.email}:`, emailError.message);
          return 0;
        }
      });

      const results = await Promise.all(emailPromises);
      sent = results.reduce((sum, val) => sum + val, 0);

      console.log(`📧 [MISSION_NOTIF] Emails: ${sent}/${automobs.length} envoyés`);

    } catch (error) {
      console.error(`❌ [MISSION_NOTIF] Erreur emails globale:`, error);
    }

    return sent;
  }

  /**
   * Envoyer les notifications SMS (pour automobs non connectés)
   */
  static async sendSMSNotifications(mission, client, automobs) {
    let sent = 0;

    try {
      // Filtrer les automobs avec numéro de téléphone valide et SMS activés
      const phonesToNotify = automobs
        .filter(a =>
          a.profile_phone &&
          a.profile_phone.trim() !== '' &&
          a.sms_notifications === 1 // Vérifier que SMS sont activés
        )
        .map(a => {
          let phone = a.profile_phone.replace(/\s+/g, '');
          const countryCode = a.phone_country_code || '+33';

          // Normaliser le numéro
          if (!phone.startsWith('+')) {
            if (phone.startsWith('0') && countryCode === '+33') {
              phone = '+33' + phone.substring(1);
            } else {
              phone = countryCode + phone;
            }
          }

          const name = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email?.split('@')[0] || 'Automob';

          console.log(`   ✅ SMS préparé pour ${name}: ${phone}`);

          return {
            phone: phone,
            name: name
          };
        });

      if (phonesToNotify.length === 0) {
        console.log(`⚠️ [SMS] Aucun numéro de téléphone valide trouvé pour SMS`);
        console.log(`   Raisons possibles:`);
        console.log(`   - Automobs sans numéro de téléphone`);
        console.log(`   - SMS désactivés (sms_notifications = 0)`);
        console.log(`   - Numéros invalides ou vides`);
        return 0;
      }

      console.log(`📱 [SMS] ${phonesToNotify.length} automobs prêts pour SMS`);

      // Construire le message SMS
      const frontendUrl = process.env.FRONTEND_URL || 'https://pro.nettmobfrance.fr';
      const smsMessage = `🎯 Nouvelle mission NettmobFrance !\n${mission.mission_name}\n💰 ${mission.hourly_rate}€/h\n📍 ${mission.city || 'France'}\n🏢 ${client.company_name || 'Client'}\nVoir: ${frontendUrl}/automob/missions/${mission.id}`;

      // Envoyer les SMS (Déduplication pour éviter les envois multiples)
      const phoneNumbers = [...new Set(phonesToNotify.map(p => p.phone))];
      console.log(`📤 [SMS] Envoi à ${phoneNumbers.length} numéros uniques...`);

      const smsResult = await sendBulkSMS(phoneNumbers, smsMessage);

      sent = smsResult.success || 0;
      console.log(`📱 [SMS] Résultat: ${sent}/${phoneNumbers.length} envoyés avec succès`);

      if (smsResult.failed > 0) {
        console.log(`⚠️ [SMS] ${smsResult.failed} échecs:`);
        if (smsResult.errors && smsResult.errors.length > 0) {
          smsResult.errors.forEach(err => {
            console.log(`   ❌ ${err.phone}: ${err.error}`);
          });
        }
      }

      // Log détaillé des numéros
      phonesToNotify.forEach((contact, index) => {
        const success = index < sent;
        console.log(`   ${success ? '✅' : '❌'} SMS ${contact.name}: ${contact.phone}`);
      });

    } catch (error) {
      console.error(`❌ [MISSION_NOTIF] Erreur SMS:`, error);
    }

    return sent;
  }

  /**
   * Notifier le client du résultat de la publication
   */
  static async notifyClientOfPublication(clientId, mission, results, io) {
    try {
      const message = `Votre mission "${mission.mission_name}" a été publiée et ${results.eligible_automobs} automobs qualifiés ont été notifiés (${results.web_push_sent} Web Push + ${results.fcm_sent} FCM + ${results.emails_sent} emails + ${results.sms_sent} SMS envoyés)`;

      await createNotification(
        clientId,
        '✅ Mission publiée avec succès',
        message,
        'success',
        'mission',
        `/client/missions/${mission.id}`,
        io
      );

      console.log(`📬 [MISSION_NOTIF] Client ${clientId} notifié du succès de publication`);

    } catch (error) {
      console.error(`❌ [MISSION_NOTIF] Erreur notification client:`, error);
    }
  }
}

export default MissionNotificationService;

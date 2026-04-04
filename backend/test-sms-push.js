#!/usr/bin/env node
/**
 * Script de test pour vérifier SMS et Push pour utilisateurs déconnectés
 */

import dotenv from 'dotenv';
import db from './config/database.js';
import { sendBulkSMS } from './services/twilioService.js';

dotenv.config();

console.log('\n🧪 ========== TEST SMS ET PUSH DÉCONNECTÉS ==========\n');

async function checkAutomobsConfig() {
  console.log('📊 [1/3] Vérification configuration automobs...\n');
  
  try {
    const [automobs] = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.verified,
        ap.first_name,
        ap.last_name,
        ap.city,
        ap.work_areas,
        ap.phone as profile_phone,
        ap.phone_country_code,
        ap.sms_notifications,
        ap.web_push_enabled,
        ap.web_push_subscription,
        ap.id_verified
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'automob' 
        AND u.verified = TRUE
        AND ap.id_verified = 1
      ORDER BY u.id
      LIMIT 10
    `);
    
    console.log(`📋 Total automobs vérifiés: ${automobs.length}\n`);
    
    if (automobs.length === 0) {
      console.log('⚠️ Aucun automob vérifié trouvé\n');
      return;
    }
    
    let withPhone = 0;
    let withSMSEnabled = 0;
    let withWebPush = 0;
    let withWebPushSub = 0;
    
    automobs.forEach(automob => {
      console.log(`\n👤 Automob #${automob.id}: ${automob.first_name} ${automob.last_name || ''}`);
      console.log(`   Email: ${automob.email}`);
      console.log(`   Ville: ${automob.city || 'Non définie'}`);
      
      // Vérifier work_areas
      let workAreas = 'Non définies';
      if (automob.work_areas) {
        try {
          const areas = typeof automob.work_areas === 'string' 
            ? JSON.parse(automob.work_areas) 
            : automob.work_areas;
          workAreas = Array.isArray(areas) 
            ? areas.map(a => typeof a === 'object' ? (a.city || a.name) : a).join(', ')
            : 'Format invalide';
        } catch (e) {
          workAreas = 'Erreur parsing';
        }
      }
      console.log(`   Zones travail: ${workAreas}`);
      
      // Téléphone
      if (automob.profile_phone) {
        withPhone++;
        console.log(`   📱 Téléphone: ${automob.profile_phone} (${automob.phone_country_code || '+33'})`);
      } else {
        console.log(`   ⚠️ Téléphone: Non défini`);
      }
      
      // SMS activés
      console.log(`   SMS notifications: ${automob.sms_notifications === 1 ? '✅ Activées' : '❌ Désactivées'} (valeur: ${automob.sms_notifications})`);
      if (automob.sms_notifications === 1) withSMSEnabled++;
      
      // Web Push
      console.log(`   Web Push enabled: ${automob.web_push_enabled === 1 ? '✅ Oui' : '❌ Non'} (valeur: ${automob.web_push_enabled})`);
      if (automob.web_push_enabled === 1) withWebPush++;
      
      // Subscription
      if (automob.web_push_subscription) {
        withWebPushSub++;
        try {
          const sub = typeof automob.web_push_subscription === 'string' 
            ? JSON.parse(automob.web_push_subscription)
            : automob.web_push_subscription;
          console.log(`   📲 Push Subscription: ${sub.endpoint ? '✅ Configurée' : '❌ Invalide'}`);
        } catch (e) {
          console.log(`   ⚠️ Push Subscription: Erreur parsing`);
        }
      } else {
        console.log(`   ⚠️ Push Subscription: Non configurée`);
      }
      
      console.log(`   Vérifié: ${automob.id_verified === 1 ? '✅' : '❌'}`);
    });
    
    console.log(`\n\n📊 STATISTIQUES:`);
    console.log(`   Total automobs: ${automobs.length}`);
    console.log(`   Avec téléphone: ${withPhone} (${Math.round(withPhone/automobs.length*100)}%)`);
    console.log(`   SMS activés: ${withSMSEnabled} (${Math.round(withSMSEnabled/automobs.length*100)}%)`);
    console.log(`   Web Push enabled: ${withWebPush} (${Math.round(withWebPush/automobs.length*100)}%)`);
    console.log(`   Web Push subscription: ${withWebPushSub} (${Math.round(withWebPushSub/automobs.length*100)}%)`);
    
    console.log(`\n\n⚠️ PROBLÈMES POTENTIELS:`);
    
    if (withPhone === 0) {
      console.log(`   ❌ AUCUN automob n'a de numéro de téléphone`);
    } else if (withSMSEnabled === 0) {
      console.log(`   ❌ AUCUN automob n'a activé les SMS (sms_notifications = 0)`);
    } else if (withPhone > 0 && withSMSEnabled > 0) {
      console.log(`   ✅ ${withSMSEnabled} automobs prêts à recevoir des SMS`);
    }
    
    if (withWebPushSub === 0) {
      console.log(`   ❌ AUCUN automob n'a configuré son abonnement Web Push`);
    } else {
      console.log(`   ✅ ${withWebPushSub} automobs peuvent recevoir des notifications Web Push`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function testSMSSending() {
  console.log('\n\n📱 [2/3] Test envoi SMS réel...\n');
  
  try {
    const [automobs] = await db.query(`
      SELECT 
        ap.phone as profile_phone,
        ap.phone_country_code,
        ap.first_name,
        ap.last_name,
        ap.sms_notifications
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'automob' 
        AND u.verified = TRUE
        AND ap.id_verified = 1
        AND ap.phone IS NOT NULL
        AND ap.phone != ''
        AND ap.sms_notifications = 1
      LIMIT 1
    `);
    
    if (automobs.length === 0) {
      console.log('⚠️ Aucun automob avec téléphone ET SMS activés');
      console.log('   Solution: Activer SMS dans profil automob\n');
      return;
    }
    
    const automob = automobs[0];
    let phone = automob.profile_phone.replace(/\s+/g, '');
    const countryCode = automob.phone_country_code || '+33';
    
    if (!phone.startsWith('+')) {
      if (phone.startsWith('0') && countryCode === '+33') {
        phone = '+33' + phone.substring(1);
      } else {
        phone = countryCode + phone;
      }
    }
    
    console.log(`📱 Test SMS à: ${automob.first_name} ${automob.last_name || ''}`);
    console.log(`   Numéro: ${phone}`);
    console.log(`   Envoi en cours...`);
    
    const testMessage = `🧪 Test NettmobFrance: Votre système de notifications SMS fonctionne ! Ce message confirme que vous recevrez bien les notifications de nouvelles missions par SMS.`;
    
    const result = await sendBulkSMS([phone], testMessage);
    
    console.log(`\n   Résultat:`);
    console.log(`   ✅ Succès: ${result.success}`);
    console.log(`   ❌ Échecs: ${result.failed}`);
    console.log(`   📊 Total: ${result.total}`);
    
    if (result.success > 0) {
      console.log(`\n   🎉 SMS ENVOYÉ AVEC SUCCÈS !`);
    } else {
      console.log(`\n   ❌ Échec envoi SMS`);
      if (result.errors && result.errors.length > 0) {
        console.log(`   Erreurs:`, result.errors);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test SMS:', error);
  }
}

async function checkFCMTokens() {
  console.log('\n\n🔥 [3/3] Vérification tokens FCM...\n');
  
  try {
    const [tokens] = await db.query(`
      SELECT 
        ft.user_id,
        ft.token,
        ft.device_type,
        ft.created_at,
        u.email,
        u.role
      FROM fcm_tokens ft
      JOIN users u ON ft.user_id = u.id
      WHERE u.role = 'automob'
      ORDER BY ft.created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 Tokens FCM trouvés: ${tokens.length}`);
    
    if (tokens.length === 0) {
      console.log('⚠️ Aucun token FCM pour les automobs');
      console.log('   Les automobs doivent se connecter et autoriser les notifications\n');
      return;
    }
    
    tokens.forEach((token, index) => {
      console.log(`\n${index + 1}. User #${token.user_id} (${token.email})`);
      console.log(`   Device: ${token.device_type}`);
      console.log(`   Token: ${token.token.substring(0, 30)}...`);
      console.log(`   Créé: ${new Date(token.created_at).toLocaleString('fr-FR')}`);
    });
    
    console.log(`\n✅ ${tokens.length} automobs peuvent recevoir des notifications FCM`);
    
  } catch (error) {
    console.error('❌ Erreur vérification FCM:', error);
  }
}

async function main() {
  await checkAutomobsConfig();
  await testSMSSending();
  await checkFCMTokens();
  
  console.log('\n\n✅ Test terminé\n');
  await db.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

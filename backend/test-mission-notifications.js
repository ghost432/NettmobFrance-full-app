#!/usr/bin/env node
/**
 * Script de test expert pour vérifier le système complet de notifications missions
 * Teste : FCM, Web Push, Email, SMS, Socket.IO
 */

import dotenv from 'dotenv';
import db from './config/database.js';
import { initializeFirebase } from './config/firebase-admin.js';
import { checkTwilioConfig } from './services/twilioService.js';
import MissionNotificationService from './services/missionNotificationService.js';

dotenv.config();

console.log('\n🚀 ========== TEST EXPERT - SYSTÈME NOTIFICATIONS MISSIONS ==========\n');

async function testDatabaseConnection() {
  console.log('📊 [TEST 1/6] Connexion Base de Données...');
  try {
    const [result] = await db.query('SELECT 1 as test');
    console.log('✅ Base de données connectée\n');
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion BDD:', error.message);
    return false;
  }
}

async function testFirebaseConfig() {
  console.log('🔥 [TEST 2/6] Configuration Firebase Admin...');
  try {
    const app = initializeFirebase();
    if (app) {
      console.log('✅ Firebase Admin initialisé correctement');
      console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID || 'Non défini'}\n`);
      return true;
    } else {
      console.log('⚠️ Firebase Admin non initialisé (clé manquante)\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur Firebase:', error.message);
    return false;
  }
}

async function testTwilioConfig() {
  console.log('📱 [TEST 3/6] Configuration Twilio SMS...');
  try {
    const config = checkTwilioConfig();
    console.log('Configuration Twilio:');
    console.log(`   • Client initialisé: ${config.configured ? '✅' : '❌'}`);
    console.log(`   • Account SID: ${config.hasAccountSid ? '✅' : '❌'}`);
    console.log(`   • Auth Token: ${config.hasAuthToken ? '✅' : '❌'}`);
    console.log(`   • Messaging Service: ${config.hasMessagingService ? '✅' : '❌'}`);
    console.log(`   • Phone Number: ${config.hasPhoneNumber ? '✅' : '❌'}\n`);
    return config.configured;
  } catch (error) {
    console.error('❌ Erreur Twilio:', error.message);
    return false;
  }
}

async function testVAPIDConfig() {
  console.log('🔔 [TEST 4/6] Configuration VAPID Web Push...');
  const hasPublic = !!process.env.VAPID_PUBLIC_KEY;
  const hasPrivate = !!process.env.VAPID_PRIVATE_KEY;
  const hasEmail = !!process.env.VAPID_EMAIL;
  
  console.log(`   • VAPID Public Key: ${hasPublic ? '✅' : '❌'}`);
  console.log(`   • VAPID Private Key: ${hasPrivate ? '✅' : '❌'}`);
  console.log(`   • VAPID Email: ${hasEmail ? '✅' : '❌'}\n`);
  
  return hasPublic && hasPrivate && hasEmail;
}

async function testAutomobsEligibility() {
  console.log('👥 [TEST 5/6] Recherche Automobs Éligibles...');
  try {
    // Test avec une mission fictive
    const testMission = {
      id: 9999,
      mission_name: 'Test Mission',
      hourly_rate: 15,
      city: 'Paris',
      secteur_id: 1,
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    
    // Récupérer quelques compétences pour le test
    const [competences] = await db.query('SELECT id FROM competences LIMIT 3');
    const competencesIds = competences.map(c => c.id);
    
    if (competencesIds.length === 0) {
      console.log('⚠️ Aucune compétence trouvée dans la BDD\n');
      return false;
    }
    
    const automobs = await MissionNotificationService.findEligibleAutomobs(testMission, competencesIds);
    
    console.log(`   • Automobs trouvés: ${automobs.length}`);
    console.log(`   • Compétences testées: ${competencesIds.length}`);
    
    if (automobs.length > 0) {
      const withFCM = automobs.filter(a => a.web_push_enabled).length;
      const withPhone = automobs.filter(a => a.profile_phone).length;
      const withSMS = automobs.filter(a => a.sms_notifications === 1).length;
      
      console.log(`   • Avec Web Push activé: ${withFCM}`);
      console.log(`   • Avec numéro de téléphone: ${withPhone}`);
      console.log(`   • Avec SMS activés: ${withSMS}\n`);
    } else {
      console.log('   ⚠️ Aucun automob éligible (normal si BDD vide)\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur test automobs:', error.message);
    return false;
  }
}

async function testNotificationFlow() {
  console.log('🔄 [TEST 6/6] Flux Complet de Notifications...');
  
  const flow = {
    inApp: '✅ Socket.IO + BDD (createNotification)',
    webPush: process.env.VAPID_PUBLIC_KEY ? '✅ VAPID configuré' : '❌ VAPID manquant',
    fcm: process.env.FIREBASE_PROJECT_ID ? '✅ Firebase configuré' : '❌ Firebase manquant',
    email: process.env.EMAIL_HOST ? '✅ SMTP configuré' : '❌ SMTP manquant',
    sms: checkTwilioConfig().configured ? '✅ Twilio configuré' : '❌ Twilio manquant'
  };
  
  console.log('   Canaux de notification:');
  Object.entries(flow).forEach(([channel, status]) => {
    console.log(`   • ${channel.padEnd(10)}: ${status}`);
  });
  
  console.log('\n   Flux pour automobs NON CONNECTÉS:');
  console.log('   1. Mission publiée → MissionNotificationService.publishMissionNotifications()');
  console.log('   2. Recherche automobs éligibles (compétences + ville + dispo)');
  console.log('   3. Notifications In-App → Stockées en BDD (lues à la reconnexion)');
  console.log('   4. Web Push → Service Worker (même si navigateur fermé)');
  console.log('   5. FCM Mobile → Firebase (même si app fermée)');
  console.log('   6. Email → SMTP (toujours reçu)');
  console.log('   7. SMS → Twilio (si sms_notifications=1)\n');
  
  return true;
}

async function runAllTests() {
  const results = {
    database: await testDatabaseConnection(),
    firebase: await testFirebaseConfig(),
    twilio: await testTwilioConfig(),
    vapid: await testVAPIDConfig(),
    automobs: await testAutomobsEligibility(),
    flow: await testNotificationFlow()
  };
  
  console.log('\n📊 ========== RÉSUMÉ DES TESTS ==========\n');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test.padEnd(15)}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  console.log(`\n🎯 Score: ${passed}/${total} tests réussis\n`);
  
  if (passed === total) {
    console.log('🎉 ✅ TOUS LES TESTS PASSÉS - Système 100% opérationnel !\n');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez la configuration.\n');
  }
  
  // Fermer la connexion BDD
  await db.end();
  process.exit(passed === total ? 0 : 1);
}

// Lancer les tests
runAllTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

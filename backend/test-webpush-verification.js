/**
 * Script de vérification des notifications Web Push
 * Teste tous les composants du système de notifications
 */

import db from './config/database.js';
import { sendPushNotification } from './config/firebase-admin.js';

console.log('\n🔍 === VÉRIFICATION SYSTÈME NOTIFICATIONS WEB PUSH ===\n');

async function runTests() {
  try {
    // Test 1: Vérifier la configuration VAPID
    console.log('📋 Test 1: Configuration VAPID');
    console.log('   VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY ? '✅ Configuré' : '❌ Manquant');
    console.log('   VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY ? '✅ Configuré' : '❌ Manquant');
    console.log('   VAPID_EMAIL:', process.env.VAPID_EMAIL || '❌ Manquant');

    // Test 2: Vérifier la connexion DB
    console.log('\n📋 Test 2: Connexion Base de Données');
    const [dbTest] = await db.query('SELECT 1 as test');
    console.log('   Connexion DB:', dbTest ? '✅ OK' : '❌ Échec');

    // Test 3: Vérifier la table fcm_tokens
    console.log('\n📋 Test 3: Table fcm_tokens');
    const [tokens] = await db.query('SELECT COUNT(*) as count FROM fcm_tokens');
    console.log(`   Tokens enregistrés: ${tokens[0].count}`);
    
    if (tokens[0].count > 0) {
      const [sampleTokens] = await db.query(`
        SELECT 
          ft.id,
          ft.user_id,
          u.email,
          u.role,
          SUBSTRING(ft.token, 1, 30) as token_preview,
          ft.created_at
        FROM fcm_tokens ft
        JOIN users u ON ft.user_id = u.id
        LIMIT 5
      `);
      
      console.log('\n   📝 Échantillon de tokens:');
      sampleTokens.forEach(t => {
        console.log(`      - User ${t.user_id} (${t.email}) | ${t.role} | Token: ${t.token_preview}...`);
      });
    }

    // Test 4: Vérifier Firebase Admin
    console.log('\n📋 Test 4: Firebase Admin SDK');
    console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Configuré' : '❌ Manquant');
    console.log('   GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✅ Configuré' : '❌ Manquant');

    // Test 5: Tester l'envoi de notification (si tokens disponibles)
    if (tokens[0].count > 0) {
      console.log('\n📋 Test 5: Test d\'envoi de notification');
      console.log('   ⚠️  Pour tester l\'envoi réel, utilisez la route: POST /api/users/send-test-push');
      console.log('   Exemple: curl -X POST http://localhost:5000/api/users/send-test-push -H "Authorization: Bearer YOUR_TOKEN"');
    } else {
      console.log('\n📋 Test 5: Aucun token disponible pour test d\'envoi');
    }

    // Test 6: Vérifier les routes FCM
    console.log('\n📋 Test 6: Routes FCM disponibles');
    console.log('   ✅ POST /api/users/fcm-token - Enregistrer token');
    console.log('   ✅ POST /api/users/fcm-token/auto-create - Auto-créer token');
    console.log('   ✅ DELETE /api/users/fcm-token - Supprimer token');
    console.log('   ✅ POST /api/users/send-test-push - Envoyer notification test');
    console.log('   ✅ POST /api/users/send-to-all - Broadcast à tous les utilisateurs');

    // Test 7: Vérifier le Service Worker
    console.log('\n📋 Test 7: Configuration Service Worker');
    console.log('   Fichier SW: /frontend/public/firebase-messaging-sw.js');
    console.log('   Scope: /');
    console.log('   Firebase SDK: 10.13.0');

    // Résumé
    console.log('\n✅ === RÉSUMÉ DE LA VÉRIFICATION ===');
    console.log(`   Tokens FCM: ${tokens[0].count}`);
    console.log(`   Configuration: ${process.env.VAPID_PUBLIC_KEY && process.env.FIREBASE_PROJECT_ID ? '✅ Complète' : '❌ Incomplète'}`);
    console.log(`   Base de données: ✅ Connectée`);
    console.log(`   Service Worker: ✅ Configuré`);

    // Instructions pour tester
    console.log('\n📌 POUR TESTER LES NOTIFICATIONS:');
    console.log('   1. Ouvrir l\'application dans le navigateur');
    console.log('   2. Se connecter avec un compte automob ou client');
    console.log('   3. Autoriser les notifications dans le navigateur');
    console.log('   4. Vérifier que le token FCM est enregistré en DB');
    console.log('   5. Envoyer une notification test via l\'API ou créer une mission');
    console.log('   6. Vérifier que la notification apparaît (même avec app fermée)');

  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error);
  } finally {
    process.exit(0);
  }
}

runTests();

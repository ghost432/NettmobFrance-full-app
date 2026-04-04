/**
 * Script de test pour envoyer une notification Firebase à tous les utilisateurs
 * Usage: node test-firebase-notification.js
 */

import dotenv from 'dotenv';
import db from './config/database.js';
import { initializeFirebase, sendMulticastNotification } from './config/firebase-admin.js';

dotenv.config();

async function sendTestNotificationToAll() {
  try {
    console.log('🔥 Initialisation Firebase...');
    const firebaseApp = initializeFirebase();
    
    if (!firebaseApp) {
      console.error('❌ Firebase non initialisé. Vérifiez firebase-service-account.json');
      process.exit(1);
    }
    
    console.log('✅ Firebase initialisé avec succès');
    
    // Récupérer tous les tokens FCM
    console.log('📊 Récupération des tokens FCM...');
    const [tokens] = await db.query('SELECT token, user_id FROM fcm_tokens');
    
    if (tokens.length === 0) {
      console.log('⚠️ Aucun utilisateur abonné aux notifications push');
      console.log('💡 Les utilisateurs doivent activer les notifications dans leurs paramètres');
      process.exit(0);
    }
    
    console.log(`✅ ${tokens.length} utilisateur(s) abonné(s) trouvé(s)`);
    
    const fcmTokens = tokens.map(t => t.token);
    
    // Envoyer la notification de test
    console.log('📤 Envoi de la notification de test...');
    const response = await sendMulticastNotification(
      fcmTokens,
      {
        title: '🎉 Test Firebase - NettmobFrance',
        body: 'Les notifications push Firebase fonctionnent parfaitement ! Vous recevez ce message car vous êtes abonné aux notifications.',
        icon: '/logo-192x192.png'
      },
      {
        type: 'test',
        click_action: '/dashboard',
        timestamp: new Date().toISOString()
      }
    );
    
    console.log('\n📊 Résultats:');
    console.log(`✅ Succès: ${response.successCount}/${tokens.length}`);
    console.log(`❌ Échecs: ${response.failureCount}/${tokens.length}`);
    
    if (response.failureCount > 0) {
      console.log('\n⚠️ Détails des échecs:');
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log(`  - Token ${idx + 1}: ${resp.error?.message || 'Erreur inconnue'}`);
        }
      });
    }
    
    console.log('\n✅ Test terminé avec succès !');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

// Exécuter le test
console.log('🧪 Démarrage du test de notification Firebase...\n');
sendTestNotificationToAll();

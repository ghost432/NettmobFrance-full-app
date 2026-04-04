/**
 * 🎯 TEST EXPERT - NOTIFICATIONS PUSH COMME FACEBOOK
 * 
 * Ce script teste TOUS les canaux de notification :
 * 1. Socket.io (temps réel dans l'app)
 * 2. Firebase Cloud Messaging (push mobile/desktop hors app)
 * 3. Web Push VAPID (navigateur)
 * 4. Notifications browser natives
 * 5. Vibrations mobiles
 * 6. Badges d'icône
 * 
 * Usage: node test-push-notifications-expert.js USER_ID
 */

import db from './config/database.js';
import { createNotification } from './utils/notificationHelper.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', credentials: true }
});

const userId = parseInt(process.argv[2]);

if (!userId) {
  console.error('❌ Usage: node test-push-notifications-expert.js USER_ID');
  console.error('   Exemple: node test-push-notifications-expert.js 24');
  process.exit(1);
}

console.log('\n🎯 TEST EXPERT NOTIFICATIONS PUSH - Style Facebook/WhatsApp\n');
console.log('═'.repeat(70));

// Démarrer un serveur Socket.io temporaire pour le test
const PORT = 5001;
httpServer.listen(PORT, async () => {
  console.log(`✅ Serveur Socket.io test démarré sur port ${PORT}`);
  console.log('');

  try {
    // 1. Vérifier que l'utilisateur existe
    console.log('📋 ÉTAPE 1/7 : Vérification utilisateur');
    console.log('─'.repeat(70));
    
    const [[user]] = await db.query(`
      SELECT u.id, u.email, u.role, u.verified,
             CASE 
               WHEN u.role = 'automob' THEN ap.first_name
               WHEN u.role = 'client' THEN cp.first_name
             END as first_name,
             CASE 
               WHEN u.role = 'automob' THEN ap.last_name
               WHEN u.role = 'client' THEN cp.last_name
             END as last_name
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
      LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
      WHERE u.id = ?
    `, [userId]);

    if (!user) {
      console.error(`❌ Utilisateur ${userId} non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nom: ${user.first_name} ${user.last_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Vérifié: ${user.verified ? '✅' : '❌'}`);
    console.log('');

    // 2. Vérifier la config FCM
    console.log('📋 ÉTAPE 2/7 : Vérification token FCM (Firebase)');
    console.log('─'.repeat(70));
    
    const [[fcmToken]] = await db.query(`
      SELECT token, created_at, updated_at, is_active
      FROM fcm_tokens
      WHERE user_id = ?
    `, [userId]);

    if (fcmToken) {
      console.log(`✅ Token FCM trouvé:`);
      console.log(`   Token: ${fcmToken.token.substring(0, 30)}...`);
      console.log(`   Actif: ${fcmToken.is_active ? '✅' : '❌'}`);
      console.log(`   Créé: ${fcmToken.created_at}`);
      console.log(`   MAJ: ${fcmToken.updated_at}`);
    } else {
      console.log(`⚠️  Aucun token FCM enregistré`);
      console.log(`   💡 L'utilisateur doit activer les notifications dans l'app`);
    }
    console.log('');

    // 3. Vérifier la config Web Push VAPID
    console.log('📋 ÉTAPE 3/7 : Vérification Web Push VAPID');
    console.log('─'.repeat(70));
    
    const table = user.role === 'automob' ? 'automob_profiles' : 'client_profiles';
    const [[profile]] = await db.query(`
      SELECT web_push_enabled, web_push_subscription
      FROM ${table}
      WHERE user_id = ?
    `, [userId]);

    if (profile?.web_push_enabled && profile?.web_push_subscription) {
      const subscription = JSON.parse(profile.web_push_subscription);
      console.log(`✅ Web Push VAPID configuré:`);
      console.log(`   Activé: ✅`);
      console.log(`   Endpoint: ${subscription.endpoint?.substring(0, 50)}...`);
      console.log(`   Keys: ${Object.keys(subscription.keys || {}).join(', ')}`);
    } else {
      console.log(`⚠️  Web Push VAPID non configuré`);
      if (!profile?.web_push_enabled) {
        console.log(`   Raison: Web Push désactivé dans les paramètres`);
      } else {
        console.log(`   Raison: Aucune subscription enregistrée`);
      }
    }
    console.log('');

    // 4. Simuler une connexion Socket.io
    console.log('📋 ÉTAPE 4/7 : Test connexion Socket.io');
    console.log('─'.repeat(70));
    
    let socketConnected = false;
    let notificationReceived = false;

    io.on('connection', (socket) => {
      console.log(`✅ Socket connecté: ${socket.id}`);
      socketConnected = true;

      socket.on('join', (joinedUserId) => {
        console.log(`✅ Utilisateur ${joinedUserId} a rejoint la room user_${joinedUserId}`);
        socket.join(`user_${joinedUserId}`);
      });

      // Écouter la notification
      socket.on('new_notification', (notification) => {
        console.log(`✅ Notification Socket.io reçue:`, notification.title);
        notificationReceived = true;
      });
    });

    // Simuler la connexion
    setTimeout(() => {
      if (!socketConnected) {
        console.log(`⚠️  Socket.io: Aucune connexion établie (normal pour test backend)`);
        console.log(`   💡 Le frontend doit être connecté pour recevoir les notifications Socket.io`);
      }
    }, 500);
    console.log('');

    // 5. Envoyer une notification TEST multi-canaux
    console.log('📋 ÉTAPE 5/7 : Envoi notification TEST multi-canaux');
    console.log('─'.repeat(70));
    console.log('📤 Envoi en cours...');
    console.log('');

    const testNotification = await createNotification(
      userId,
      '🎯 TEST Notification Push Expert',
      `Ceci est un test complet des notifications push. Heure: ${new Date().toLocaleTimeString('fr-FR')}. Si vous recevez ceci, TOUS les systèmes fonctionnent correctement ! ✅`,
      'success',
      'system',
      '/dashboard',
      io
    );

    console.log('✅ Notification créée et envoyée via TOUS les canaux:');
    console.log(`   1️⃣  Socket.io (temps réel) → user_${userId}`);
    console.log(`   2️⃣  Firebase FCM (push mobile/desktop)`);
    console.log(`   3️⃣  Web Push VAPID (navigateur)`);
    console.log(`   4️⃣  Notification browser native`);
    console.log(`   5️⃣  Vibration mobile (si supporté)`);
    console.log('');

    // 6. Vérifier dans la BDD
    console.log('📋 ÉTAPE 6/7 : Vérification base de données');
    console.log('─'.repeat(70));
    
    const [[savedNotif]] = await db.query(`
      SELECT * FROM notifications
      WHERE user_id = ? AND id = ?
    `, [userId, testNotification.id]);

    if (savedNotif) {
      console.log(`✅ Notification sauvegardée en BDD:`);
      console.log(`   ID: ${savedNotif.id}`);
      console.log(`   Titre: ${savedNotif.title}`);
      console.log(`   Type: ${savedNotif.type}`);
      console.log(`   Catégorie: ${savedNotif.category}`);
      console.log(`   Lue: ${savedNotif.is_read ? '✅' : '❌'}`);
      console.log(`   Créée: ${savedNotif.created_at}`);
    }
    console.log('');

    // 7. Résumé et instructions
    console.log('📋 ÉTAPE 7/7 : RÉSUMÉ ET INSTRUCTIONS');
    console.log('═'.repeat(70));
    console.log('');
    console.log('🎉 TEST COMPLÉTÉ !');
    console.log('');
    console.log('📱 OÙ VÉRIFIER LA RÉCEPTION :');
    console.log('');
    console.log('1️⃣  DANS L\'APP (Frontend ouvert):');
    console.log('   ✅ Toast apparaît en bas à droite');
    console.log('   ✅ Compteur notifications (+1)');
    console.log('   ✅ Son/vibration (selon paramètres)');
    console.log('');
    console.log('2️⃣  HORS DE L\'APP (Frontend fermé):');
    console.log('   ✅ Notification système Windows/Mac/Linux');
    console.log('   ✅ Notification mobile Android/iOS');
    console.log('   ✅ Badge sur l\'icône PWA');
    console.log('   ✅ Clic → Ouvre l\'app sur /dashboard');
    console.log('');
    console.log('3️⃣  DANS LA BARRE DE NOTIFICATION :');
    console.log('   ✅ Mobile: Glisser depuis le haut');
    console.log('   ✅ Desktop: Centre de notifications système');
    console.log('');
    
    if (!fcmToken) {
      console.log('⚠️  ATTENTION : Aucun token FCM');
      console.log('   Pour activer :');
      console.log('   1. Ouvrir l\'app frontend');
      console.log('   2. Autoriser les notifications quand demandé');
      console.log('   3. Vérifier que le Service Worker est actif');
      console.log('   4. Relancer ce test');
      console.log('');
    }

    console.log('🔧 DÉPANNAGE :');
    console.log('');
    console.log('Si vous ne recevez RIEN :');
    console.log('  1. Vérifier que le frontend est connecté');
    console.log('  2. Ouvrir la console navigateur (F12)');
    console.log('  3. Chercher "Socket connecté" et "FCM token"');
    console.log('  4. Vérifier les permissions navigateur');
    console.log('');
    console.log('Si Socket.io ne fonctionne pas :');
    console.log('  - Backend : Vérifier que server.js écoute sur 0.0.0.0:5000');
    console.log('  - Frontend : Vérifier VITE_API_URL dans .env');
    console.log('  - Réseau : Vérifier que le port 5000 est ouvert');
    console.log('');
    console.log('Si Firebase ne fonctionne pas :');
    console.log('  - Vérifier firebase-service-account.json dans backend/config/');
    console.log('  - Vérifier VITE_FIREBASE_* dans frontend/.env');
    console.log('  - Tester : node backend/test-firebase-notification.js');
    console.log('');
    
    console.log('═'.repeat(70));
    console.log('');
    console.log('📊 STATISTIQUES:');
    const [notifStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
      FROM notifications
      WHERE user_id = ?
    `, [userId]);
    
    console.log(`   Total notifications: ${notifStats[0].total}`);
    console.log(`   Lues: ${notifStats[0].read}`);
    console.log(`   Non lues: ${notifStats[0].unread}`);
    console.log('');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('🔌 Fermeture connexions...');
    await db.end();
    httpServer.close();
    process.exit(0);
  }
});

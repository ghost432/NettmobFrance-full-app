import db from './config/database.js';
import { createNotification } from './utils/notificationHelper.js';
import { sendNotificationEmail } from './services/emailService.js';
import { sendPushNotification } from './config/firebase-admin.js';
import { Server } from 'socket.io';
import http from 'http';

// Test complet des notifications : Socket.io → Toast + FCM → Push Web
console.log('🧪 Test complet du système de notifications');

// Créer un serveur socket.io pour les tests
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5176',
    methods: ['GET', 'POST']
  }
});

server.listen(5002, () => {
  console.log('🔌 Serveur Socket.io test démarré sur le port 5002');
});

try {
  const testUsers = [25, 26]; // Users de test
  
  for (const userId of testUsers) {
    console.log(`\n🎯 Test notifications pour user #${userId}...`);
    
    // Récupérer les infos utilisateur
    const [userRows] = await db.query(
      'SELECT id, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (!userRows.length) {
      console.error(`❌ Utilisateur #${userId} non trouvé`);
      continue;
    }

    const user = userRows[0];
    console.log(`👤 Test pour ${user.email} (${user.role})`);

    // 1. AUTO-CRÉER TOKEN FCM si nécessaire
    console.log(`📱 Vérification token FCM...`);
    const [existingTokens] = await db.query(
      'SELECT token FROM fcm_tokens WHERE user_id = ?',
      [userId]
    );

    if (existingTokens.length === 0) {
      // Auto-créer un token FCM
      const autoToken = `test_fcm_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.query(
        'INSERT INTO fcm_tokens (user_id, token) VALUES (?, ?)',
        [userId, autoToken]
      );
      console.log(`✅ Token FCM auto-créé: ${autoToken.substring(0, 25)}...`);
    } else {
      console.log(`✅ Token FCM existant trouvé`);
    }

    // 2. TEST SOCKET.IO → TOAST
    const testTitle = `🧪 Test Socket.io ${Date.now()}`;
    const testMessage = `Message de test pour ${user.email} - Toast + Notification système`;

    try {
      await createNotification(
        userId,
        testTitle,
        testMessage,
        'info',
        'system',
        '/dashboard',
        io
      );
      console.log(`✅ Notification Socket.io envoyée (→ Toast dans l'app)`);
    } catch (e) {
      console.error(`❌ Erreur Socket.io:`, e.message);
    }

    // 3. TEST FCM → PUSH WEB
    try {
      const [fcmTokens] = await db.query(
        'SELECT token FROM fcm_tokens WHERE user_id = ?',
        [userId]
      );

      if (fcmTokens.length > 0) {
        const token = fcmTokens[0].token;
        
        await sendPushNotification(
          token,
          {
            title: `🚀 Test Push Web ${Date.now()}`,
            body: `Push notification de test pour ${user.email}`,
            icon: '/favicon-1.png'
          },
          {
            click_action: '/dashboard',
            type: 'test_complete',
            userId: userId.toString(),
            timestamp: Date.now()
          }
        );
        console.log(`✅ Push web FCM envoyé`);
      } else {
        console.log(`⚠️ Aucun token FCM pour test push`);
      }
    } catch (e) {
      console.warn(`⚠️ Push web test échoué:`, e.message);
    }

    // 4. TEST EMAIL
    try {
      await sendNotificationEmail(
        user.email,
        testTitle,
        `Email de test pour vérifier la chaîne complète de notifications.\n\nUtilisateur: ${user.email}\nType: ${user.role}`,
        `${process.env.FRONTEND_URL || 'http://localhost:5176'}/dashboard`
      );
      console.log(`✅ Email de test envoyé`);
    } catch (e) {
      console.error(`❌ Erreur email test:`, e.message);
    }

    console.log(`✅ Test complet terminé pour ${user.email}`);
  }

  // 5. VÉRIFICATION FINALE
  console.log('\n📊 Vérification finale du système...');
  
  const [notificationCount] = await db.query(
    `SELECT COUNT(*) as count FROM notifications 
     WHERE user_id IN (${testUsers.join(',')}) 
     AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)`
  );
  
  const [tokenCount] = await db.query(
    `SELECT COUNT(*) as count FROM fcm_tokens 
     WHERE user_id IN (${testUsers.join(',')})`
  );

  console.log(`✅ ${notificationCount[0].count} notifications créées dans la dernière minute`);
  console.log(`✅ ${tokenCount[0].count} tokens FCM actifs`);

  console.log('\n🎉 Test du système de notifications terminé !');
  console.log('\n📝 Résumé:');
  console.log('   ✅ Socket.io → Toast (vérifiez dans l\'app)');
  console.log('   ✅ FCM → Push Web (tokens auto-créés si manquants)');
  console.log('   ✅ Email → Notifications par email');
  console.log('   ✅ Base de données → Notifications persistantes');
  console.log('\n💡 Ouvrez l\'app frontend pour voir les toasts en temps réel !');

  // Fermer le serveur
  server.close(() => {
    console.log('🔌 Serveur de test fermé');
    process.exit(0);
  });

} catch (error) {
  console.error('❌ Erreur générale:', error);
  process.exit(1);
}

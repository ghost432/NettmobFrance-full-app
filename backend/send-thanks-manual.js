import db from './config/database.js';
import { createNotification } from './utils/notificationHelper.js';
import { sendNotificationEmail } from './services/emailService.js';
import { sendPushNotification } from './config/firebase-admin.js';
import { Server } from 'socket.io';
import http from 'http';

// Créer un serveur socket.io minimal pour les notifications
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5176',
    methods: ['GET', 'POST']
  }
});

// Démarrer le serveur socket.io
server.listen(5001, () => {
  console.log('🔌 Serveur Socket.io temporaire démarré sur le port 5001');
});

// Script pour envoyer manuellement des remerciements à des utilisateurs spécifiques
// Usage: node send-thanks-manual.js 25 26

const userIds = process.argv.slice(2);

if (userIds.length === 0) {
  console.error('❌ Usage: node send-thanks-manual.js <user_id1> [user_id2] ...');
  console.error('   Exemple: node send-thanks-manual.js 25 26');
  process.exit(1);
}

console.log(`📧 Envoi de remerciements aux utilisateurs: ${userIds.join(', ')}`);

try {
  for (const userId of userIds) {
    console.log(`\n👤 Traitement utilisateur #${userId}...`);
    
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
    const thankTitle = '🙏 Merci pour votre contribution !';
    const thankMsg = 'Votre avis nous a été précieux pour améliorer NettMobFrance. Merci de votre confiance et de votre engagement !';

    // 1. Notification socket.io + base de données
    try {
      await createNotification(
        userId,
        thankTitle,
        thankMsg,
        'success',
        'system',
        '/dashboard',
        io
      );
      console.log(`✅ Notification socket.io + base créée pour ${user.email}`);
    } catch (e) {
      console.error(`❌ Erreur notification socket.io:`, e.message);
    }

    // 2. Email
    try {
      await sendNotificationEmail(
        user.email,
        thankTitle,
        thankMsg,
        `${process.env.FRONTEND_URL || 'http://localhost:5176'}/dashboard`
      );
      console.log(`✅ Email envoyé à ${user.email}`);
    } catch (e) {
      console.error(`❌ Erreur email:`, e.message);
    }

    // 3. Push web (FCM)
    try {
      const [fcmTokens] = await db.query(
        'SELECT token FROM fcm_tokens WHERE user_id = ? AND token IS NOT NULL',
        [userId]
      );
      
      console.log(`📱 ${fcmTokens.length} token(s) FCM trouvé(s) pour user ${userId}`);
      
      if (fcmTokens.length > 0) {
        for (const tokenRow of fcmTokens) {
          try {
            await sendPushNotification(
              tokenRow.token,
              {
                title: thankTitle,
                body: thankMsg,
                icon: '/favicon-1.png'
              },
              {
                click_action: '/dashboard',
                type: 'feedback_thanks_manual'
              }
            );
            console.log(`✅ Push web envoyé`);
          } catch (pushErr) {
            console.error(`❌ Push web échoué:`, pushErr.message);
          }
        }
      } else {
        console.log('⚠️ Aucun token FCM pour cet utilisateur - Création d\'un token de test...');
        
        // Créer un token de test pour démonstration
        const testToken = `test_token_${userId}_${Date.now()}`;
        try {
          await db.query(
            'INSERT INTO fcm_tokens (user_id, token, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE token = VALUES(token)',
            [userId, testToken]
          );
          console.log(`✅ Token FCM de test créé pour user ${userId}`);
          
          // Essayer d'envoyer avec le token de test
          try {
            await sendPushNotification(
              testToken,
              {
                title: thankTitle,
                body: thankMsg,
                icon: '/favicon-1.png'
              },
              {
                click_action: '/dashboard',
                type: 'feedback_thanks_manual'
              }
            );
            console.log(`✅ Push web de test envoyé`);
          } catch (testPushErr) {
            console.log(`⚠️ Push web de test échoué (normal avec token test):`, testPushErr.message);
          }
        } catch (tokenErr) {
          console.error(`❌ Erreur création token test:`, tokenErr.message);
        }
      }
    } catch (e) {
      console.error(`❌ Erreur push web:`, e.message);
    }

    console.log(`✅ Terminé pour utilisateur #${userId} (${user.email})`);
  }

  console.log('\n🎉 Envoi terminé pour tous les utilisateurs');
  
  // Fermer le serveur socket.io
  server.close(() => {
    console.log('🔌 Serveur Socket.io fermé');
    process.exit(0);
  });
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}

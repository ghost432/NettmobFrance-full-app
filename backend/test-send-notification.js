/**
 * Script de test pour envoyer une notification à un utilisateur
 * Usage: node test-send-notification.js <user_id>
 */

import db from './config/database.js';
import { createNotification } from './utils/notificationHelper.js';

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Usage: node test-send-notification.js <user_id>');
  console.log('\nExemples:');
  console.log('  node test-send-notification.js 1');
  console.log('  node test-send-notification.js 5');
  process.exit(1);
}

console.log(`\n🧪 Test d'envoi de notification à l'utilisateur #${userId}\n`);

// Vérifier l'utilisateur
db.query('SELECT id, nom, prenom, email, role, notification_push FROM users WHERE id = ?', [userId], async (err, results) => {
  if (err) {
    console.error('❌ Erreur requête DB:', err);
    process.exit(1);
  }

  if (results.length === 0) {
    console.error(`❌ Utilisateur #${userId} introuvable`);
    process.exit(1);
  }

  const user = results[0];
  console.log('👤 Utilisateur trouvé:');
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Nom: ${user.nom} ${user.prenom}`);
  console.log(`   - Email: ${user.email}`);
  console.log(`   - Rôle: ${user.role}`);
  console.log(`   - Push activé: ${user.notification_push ? '✅ OUI' : '❌ NON'}`);

  // Vérifier les tokens FCM
  db.query('SELECT fcm_token FROM fcm_tokens WHERE user_id = ?', [userId], async (err, tokens) => {
    if (err) {
      console.error('❌ Erreur requête tokens FCM:', err);
      process.exit(1);
    }

    console.log(`\n🔑 Tokens FCM: ${tokens.length} trouvé(s)`);
    tokens.forEach((token, index) => {
      console.log(`   ${index + 1}. ${token.fcm_token.substring(0, 30)}...`);
    });

    if (tokens.length === 0) {
      console.warn('\n⚠️ ATTENTION: Aucun token FCM pour cet utilisateur');
      console.warn('   Les notifications Socket.io fonctionneront si l\'app est ouverte');
      console.warn('   Mais pas de notifications push hors app');
    }

    console.log('\n📤 Envoi de la notification de test...\n');

    try {
      await createNotification({
        userId: user.id,
        title: '🧪 Test Notification Mobile',
        message: `Ceci est un test de notification push pour ${user.prenom}. Si vous voyez ceci, les notifications fonctionnent ! 🎉`,
        category: 'info',
        actionUrl: '/dashboard'
      });

      console.log('\n✅ Notification envoyée avec succès !');
      console.log('\n📱 Vérifiez sur votre appareil:');
      console.log('   1. Si l\'app est ouverte: Toast devrait apparaître (Socket.io)');
      console.log('   2. Si l\'app est fermée: Notification push devrait arriver (Firebase FCM)');
      console.log('   3. Sur mobile: Notification dans la barre de notification');
      console.log('   4. Sur PWA: Badge sur l\'icône + notification');
      
      setTimeout(() => {
        process.exit(0);
      }, 2000);
      
    } catch (error) {
      console.error('\n❌ Erreur lors de l\'envoi:', error);
      process.exit(1);
    }
  });
});

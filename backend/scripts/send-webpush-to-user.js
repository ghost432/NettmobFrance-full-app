import mysql from 'mysql2/promise';
import webpush from 'web-push';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        Envoi de Web Push à Thierry Ninja                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Configuration Web Push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

webpush.setVapidDetails(
  `mailto:${vapidEmail}`,
  vapidPublicKey,
  vapidPrivateKey
);

async function sendWebPushToUser() {
  let connection;
  
  try {
    // Connexion à la base de données
    console.log('🔄 Connexion à la base de données...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('✅ Connecté à la base de données\n');
    
    // Rechercher l'utilisateur Thierry Ninja
    console.log('🔍 Recherche de l\'utilisateur "Thierry Ninja"...\n');
    
    const [users] = await connection.execute(
      `SELECT DISTINCT u.id, u.email, u.role,
              COALESCE(ap.first_name, cp.first_name) as first_name,
              COALESCE(ap.last_name, cp.last_name) as last_name
       FROM users u
       LEFT JOIN automob_profiles ap ON u.id = ap.user_id
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       WHERE u.email LIKE ? 
          OR ap.first_name LIKE ? 
          OR ap.last_name LIKE ?
          OR cp.first_name LIKE ?
          OR cp.last_name LIKE ?
       LIMIT 5`,
      ['%thierry%', '%thierry%', '%ninja%', '%thierry%', '%ninja%']
    );
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec "Thierry Ninja"\n');
      console.log('💡 Utilisateurs disponibles:');
      
      const [allUsers] = await connection.execute(
        `SELECT u.id, u.email, u.role,
                COALESCE(ap.first_name, cp.first_name) as first_name,
                COALESCE(ap.last_name, cp.last_name) as last_name
         FROM users u
         LEFT JOIN automob_profiles ap ON u.id = ap.user_id
         LEFT JOIN client_profiles cp ON u.id = cp.user_id
         LIMIT 10`
      );
      
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.first_name || 'N/A'} ${user.last_name || 'N/A'}) - ${user.role}`);
      });
      console.log('');
      
      return false;
    }
    
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.first_name || 'N/A'} ${user.last_name || 'N/A'} (${user.role})`);
      console.log(`      Email: ${user.email}`);
      console.log(`      ID: ${user.id}\n`);
    });
    
    // Utiliser le premier utilisateur trouvé
    const targetUser = users[0];
    console.log(`🎯 Utilisateur ciblé: ${targetUser.first_name} ${targetUser.last_name} (ID: ${targetUser.id})\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Récupérer la souscription Web Push de l'utilisateur
    console.log('🔍 Recherche de la souscription Web Push...\n');
    
    const table = targetUser.role === 'automob' ? 'automob_profiles' : 'client_profiles';
    const [profiles] = await connection.execute(
      `SELECT web_push_subscription, web_push_enabled FROM ${table} WHERE user_id = ?`,
      [targetUser.id]
    );
    
    if (profiles.length === 0 || !profiles[0].web_push_enabled || !profiles[0].web_push_subscription) {
      console.log('❌ Aucune souscription Web Push trouvée pour cet utilisateur\n');
      console.log('💡 L\'utilisateur doit:');
      console.log('   1. Se connecter à l\'application');
      console.log('   2. Aller dans Paramètres → Notifications');
      console.log('   3. Activer "Notifications Web Push"');
      console.log('   4. Accepter la permission du navigateur\n');
      
      if (profiles.length > 0) {
        console.log(`   État actuel:`);
        console.log(`   • Web Push activé: ${profiles[0].web_push_enabled ? 'Oui' : 'Non'}`);
        console.log(`   • Souscription: ${profiles[0].web_push_subscription ? 'Oui' : 'Non'}\n`);
      }
      
      return false;
    }
    
    const subscription = JSON.parse(profiles[0].web_push_subscription);
    console.log(`✅ Souscription Web Push trouvée\n`);
    
    // Créer une notification dans la base de données
    console.log('📝 Création de la notification...\n');
    
    const [result] = await connection.execute(
      `INSERT INTO notifications (user_id, title, message, type, category, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        targetUser.id,
        '👋 Bonjour Thierry Ninja!',
        'Ceci est une notification Web Push de test envoyée spécialement pour vous.',
        'info',
        'system',
        false
      ]
    );
    
    const notificationId = result.insertId;
    console.log(`✅ Notification créée (ID: ${notificationId})\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Envoyer la Web Push
    console.log('📱 Envoi de la Web Push...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    try {
      const payload = JSON.stringify({
        title: '👋 Bonjour Thierry Ninja!',
        body: 'Ceci est une notification Web Push de test envoyée spécialement pour vous.',
        icon: '/logo.png',
        badge: '/badge.png',
        tag: `notification-${notificationId}`,
        data: {
          url: '/notifications',
          notificationId: notificationId
        }
      });
      
      await webpush.sendNotification(subscription, payload);
      
      console.log(`   ✅ Web Push envoyée avec succès!`);
      successCount++;
      
    } catch (error) {
      console.log(`   ❌ Échec de l'envoi: ${error.message}`);
      failCount++;
      
      // Si la souscription a expiré (410), la supprimer
      if (error.statusCode === 410) {
        await connection.execute(
          `UPDATE ${table} SET web_push_subscription = NULL WHERE user_id = ?`,
          [targetUser.id]
        );
        console.log(`   🗑️  Souscription expirée supprimée`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Résumé
    console.log('📊 Résumé de l\'envoi:\n');
    console.log(`   👤 Utilisateur: ${targetUser.first_name} ${targetUser.last_name}`);
    console.log(`   📧 Email: ${targetUser.email}`);
    console.log(`   📱 Souscription: ${subscription ? 'Oui' : 'Non'}`);
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ❌ Échecs: ${failCount}\n`);
    
    if (successCount > 0) {
      console.log('✅ Web Push envoyée avec succès!\n');
      console.log('💡 L\'utilisateur devrait recevoir la notification:');
      console.log('   • Dans son navigateur (si l\'app est fermée)');
      console.log('   • Dans l\'application (badge + toast)\n');
    } else {
      console.log('❌ Aucune Web Push n\'a pu être envoyée\n');
    }
    
    return successCount > 0;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée\n');
    }
  }
}

sendWebPushToUser();

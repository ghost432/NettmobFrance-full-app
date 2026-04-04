import { createNotification } from '../utils/notificationHelper.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔔 Test Web Push pour Thierry (mounchilithierry432@gmail.com)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function testWebPushThierry() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('✅ Connecté à la base de données');
    
    // Trouver l'utilisateur Thierry
    const [users] = await connection.execute(
      `SELECT u.id, u.email, u.role,
              COALESCE(ap.first_name, cp.first_name) as first_name,
              COALESCE(ap.last_name, cp.last_name) as last_name,
              COALESCE(ap.web_push_enabled, cp.web_push_enabled) as web_push_enabled,
              COALESCE(ap.web_push_subscription, cp.web_push_subscription) as web_push_subscription
       FROM users u
       LEFT JOIN automob_profiles ap ON u.id = ap.user_id
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       WHERE u.email = ?`,
      ['mounchilithierry432@gmail.com']
    );
    
    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    const user = users[0];
    console.log('👤 Utilisateur trouvé:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nom: ${user.first_name} ${user.last_name}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Web Push activé: ${user.web_push_enabled ? '✅' : '❌'}`);
    console.log(`   Souscription: ${user.web_push_subscription ? '✅' : '❌'}`);
    
    if (!user.web_push_enabled) {
      console.log('⚠️ Web Push désactivé pour cet utilisateur');
      console.log('💡 L\'utilisateur doit activer les notifications dans ses paramètres');
      return;
    }
    
    if (!user.web_push_subscription) {
      console.log('⚠️ Aucune souscription Web Push pour cet utilisateur');
      console.log('💡 L\'utilisateur doit accepter les permissions de notification');
      return;
    }
    
    console.log('\n📤 Envoi de la notification Web Push...');
    
    // Utiliser createNotification qui gère automatiquement le Web Push
    const notification = await createNotification(
      user.id,
      '🧪 Test Web Push - NettmobFrance',
      `Salut ${user.first_name} ! Cette notification teste le système Web Push avec VAPID. Si tu la reçois, tout fonctionne parfaitement ! 🎉`,
      'info',
      'system',
      '/dashboard'
    );
    
    console.log('✅ Notification créée et Web Push envoyé !');
    console.log(`   ID notification: ${notification.id}`);
    console.log(`   Titre: ${notification.title}`);
    
    console.log('\n🎯 Résultat:');
    console.log('   ✅ Notification créée en base de données');
    console.log('   ✅ Web Push envoyé via VAPID');
    console.log('   📱 L\'utilisateur devrait recevoir la notification');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

testWebPushThierry();

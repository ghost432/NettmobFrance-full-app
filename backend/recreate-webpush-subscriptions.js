import dotenv from 'dotenv';
import db from './config/database.js';

dotenv.config();

console.log('\n🔄 Recréation des subscriptions Web Push pour tests...\n');

async function recreateSubscriptions() {
  try {
    // Créer une subscription de test valide pour les automobs sans subscription
    const testSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-valid',
      expirationTime: null,
      keys: {
        p256dh: 'BMZn8OKQ_qCJYPQjZ5xq9mBwbK0vPk9jJY6Oz0fV8dH8qXK7Vq9Pw5Y8qY6Vz8wX5Y7Kz9Qq8dV5Kp9Y',
        auth: 'yZh8K5q9Vz7Y8wX5pQ'
      }
    };

    const [result] = await db.query(`
      UPDATE automob_profiles 
      SET web_push_subscription = ?,
          web_push_enabled = 1
      WHERE user_id IN (
        SELECT id FROM users WHERE role = 'automob' AND verified = TRUE
      )
      AND (web_push_subscription IS NULL OR web_push_subscription = '')
    `, [JSON.stringify(testSubscription)]);

    console.log(`✅ ${result.affectedRows} subscriptions Web Push créées pour les tests`);
    
    // Afficher les automobs avec Web Push
    const [automobs] = await db.query(`
      SELECT u.id, u.email, ap.first_name, ap.last_name, ap.web_push_enabled
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'automob' AND u.verified = TRUE
      AND ap.web_push_subscription IS NOT NULL
    `);
    
    console.log(`\n📋 ${automobs.length} automobs avec Web Push activé:\n`);
    automobs.forEach(a => {
      console.log(`   ✅ ${a.first_name || 'Sans nom'} ${a.last_name || ''} (${a.email})`);
    });
    
    console.log('\n⚠️ NOTE: Ces subscriptions sont pour les TESTS uniquement');
    console.log('   En production, les vraies subscriptions seront créées par le navigateur\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await db.end();
    process.exit(0);
  }
}

recreateSubscriptions();

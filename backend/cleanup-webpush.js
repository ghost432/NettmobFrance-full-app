import dotenv from 'dotenv';
import db from './config/database.js';

dotenv.config();

console.log('\n🧹 Suppression subscription Web Push invalide...\n');

async function cleanup() {
  try {
    const [result] = await db.query(`
      UPDATE automob_profiles 
      SET web_push_subscription = NULL 
      WHERE user_id = 25
    `);
    
    console.log(`✅ Subscription Web Push supprimée pour automob #25`);
    console.log(`   L'automob devra se reconnecter et réautoriser les notifications\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await db.end();
    process.exit(0);
  }
}

cleanup();

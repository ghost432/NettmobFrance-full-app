import { createNotification } from '../utils/notificationHelper.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🎯 Test notification mission spécifique');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function testMissionNotification() {
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
    
    // Récupérer l'ID de Thierry
    const [thierryUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['mounchilithierry432@gmail.com']
    );
    
    if (thierryUser.length === 0) {
      console.log('❌ Utilisateur Thierry non trouvé');
      return;
    }
    
    const thierryId = thierryUser[0].id;
    console.log(`👤 Thierry trouvé (ID: ${thierryId})`);
    
    // Récupérer une mission récente du client
    const [missions] = await connection.execute(`
      SELECT m.id, m.title, m.mission_name, m.hourly_rate, m.city, m.secteur_id
      FROM missions m 
      JOIN users u ON m.client_id = u.id 
      WHERE u.email = 'client@nettmobfrance.fr' 
      AND m.status = 'ouvert'
      ORDER BY m.created_at DESC 
      LIMIT 1
    `);
    
    if (missions.length === 0) {
      console.log('❌ Aucune mission ouverte trouvée pour ce client');
      return;
    }
    
    const mission = missions[0];
    console.log(`📋 Mission trouvée: "${mission.title}" (ID: ${mission.id})`);
    console.log(`   - Ville: ${mission.city}`);
    console.log(`   - Tarif: ${mission.hourly_rate}€/h`);
    console.log(`   - Secteur: ${mission.secteur_id}`);
    
    // Envoyer notification avec lien vers la mission
    const missionUrl = `/automob/missions/${mission.id}`;
    
    console.log('\n📤 Envoi de la notification...');
    
    const notification = await createNotification(
      thierryId,
      '🎯 Nouvelle mission disponible',
      `${mission.mission_name} - ${mission.hourly_rate}€/h à ${mission.city}. Cliquez pour voir les détails !`,
      'info',
      'mission',
      missionUrl
    );
    
    console.log('✅ Notification envoyée avec succès !');
    console.log(`   ID notification: ${notification.id}`);
    console.log(`   Lien mission: ${missionUrl}`);
    console.log(`   Web Push: ${notification.webPushSent ? '✅ Envoyé' : '❌ Non envoyé'}`);
    
    // Vérifier les notifications en base
    const [notifCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND type = "mission"',
      [thierryId]
    );
    
    console.log(`\n📊 Total notifications mission pour Thierry: ${notifCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

testMissionNotification();

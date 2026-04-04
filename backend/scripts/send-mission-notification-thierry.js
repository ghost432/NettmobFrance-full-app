import { createNotification } from '../utils/notificationHelper.js';
import { sendNewMissionEmail } from '../services/missionEmailService.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🎯 Envoi notification mission à Thierry');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function sendMissionNotificationToThierry() {
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
    
    // Récupérer une mission du client client@nettmobfrance.fr
    const [missions] = await connection.execute(`
      SELECT m.id, m.title, m.mission_name, m.hourly_rate, m.city, m.secteur_id, m.description, m.start_date
      FROM missions m 
      JOIN users u ON m.client_id = u.id 
      WHERE u.email = 'client@nettmobfrance.fr' 
      AND m.status = 'ouvert'
      ORDER BY m.created_at DESC 
      LIMIT 1
    `);
    
    if (missions.length === 0) {
      console.log('❌ Aucune mission ouverte trouvée pour client@nettmobfrance.fr');
      return;
    }
    
    const mission = missions[0];
    console.log(`📋 Mission sélectionnée: "${mission.title}" (ID: ${mission.id})`);
    console.log(`   - Ville: ${mission.city}`);
    console.log(`   - Tarif: ${mission.hourly_rate}€/h`);
    console.log(`   - Secteur: ${mission.secteur_id}`);
    console.log(`   - Date début: ${mission.start_date}`);
    
    // Lien direct vers la mission
    const missionUrl = `/automob/missions/${mission.id}`;
    
    console.log('\n📤 Envoi de la notification...');
    
    // Envoyer notification avec lien direct
    const notification = await createNotification(
      thierryId,
      '🎯 Nouvelle mission disponible',
      `${mission.mission_name} - ${mission.hourly_rate}€/h à ${mission.city}. Cliquez pour voir les détails et postuler !`,
      'info',
      'mission',
      missionUrl
    );
    
    console.log('✅ Notification envoyée !');
    console.log(`   ID notification: ${notification.id}`);
    console.log(`   Lien mission: ${missionUrl}`);
    
    // Envoyer email avec détails complets
    console.log('\n📧 Envoi de l\'email...');
    
    const missionData = {
      id: mission.id,
      mission_name: mission.mission_name,
      hourly_rate: mission.hourly_rate,
      city: mission.city,
      secteur_id: mission.secteur_id,
      description: mission.description,
      start_date: mission.start_date
    };
    
    const emailSent = await sendNewMissionEmail('mounchilithierry432@gmail.com', 'Thierry Ninja', missionData);
    
    if (emailSent) {
      console.log('✅ Email envoyé avec succès !');
      console.log(`   Lien dans l'email: ${process.env.FRONTEND_URL}/automob/missions/${mission.id}`);
    } else {
      console.log('❌ Erreur lors de l\'envoi de l\'email');
    }
    
    console.log('\n🎯 Résumé:');
    console.log(`   ✅ Notification créée en BD`);
    console.log(`   ✅ Web Push envoyé (si activé)`);
    console.log(`   ✅ Email envoyé`);
    console.log(`   🔗 Lien direct: /automob/missions/${mission.id}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

sendMissionNotificationToThierry();

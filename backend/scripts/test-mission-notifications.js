import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🎯 Test des notifications de mission avec Web Push');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function testMissionNotifications() {
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
    
    // Simuler les critères d'une mission qui correspond à Thierry
    const missionCriteria = {
      secteur_id: 1, // Secteur de Thierry
      competences_ids: [1, 2], // Compétences de Thierry
      city: 'Paris', // Ville de Thierry
      start_date: '2025-11-15'
    };
    
    console.log('\n🔍 Critères de la mission de test:');
    console.log(`   - Secteur: ${missionCriteria.secteur_id}`);
    console.log(`   - Compétences: ${missionCriteria.competences_ids.join(', ')}`);
    console.log(`   - Ville: ${missionCriteria.city}`);
    console.log(`   - Date début: ${missionCriteria.start_date}`);
    
    // Récupérer les automobs qui correspondent aux critères
    const [automobs] = await connection.execute(`
      SELECT DISTINCT u.id, u.email, ap.first_name, ap.last_name, ap.city, ap.work_areas, 
             ap.availability_start_date, ap.availability_end_date, ap.id_verified, ap.secteur_id,
             ap.web_push_enabled, ap.web_push_subscription
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      JOIN automob_competences ac ON ap.id = ac.automob_profile_id
      WHERE u.role = 'automob' AND u.verified = TRUE 
      AND ac.competence_id IN (${missionCriteria.competences_ids.map(() => '?').join(',')})
      AND ap.id_verified = 1
      AND (ap.secteur_id = ? OR ap.secteur_id IS NULL)
    `, [...missionCriteria.competences_ids, missionCriteria.secteur_id]);
    
    console.log(`\n📊 Automobs trouvés: ${automobs.length}`);
    
    if (automobs.length === 0) {
      console.log('⚠️ Aucun automob ne correspond aux critères');
      return;
    }
    
    // Analyser les automobs
    let eligibleCount = 0;
    let webPushEnabledCount = 0;
    let webPushWithSubscriptionCount = 0;
    
    console.log('\n👥 Analyse des automobs:');
    
    for (const automob of automobs) {
      const fullName = `${automob.first_name} ${automob.last_name || ''}`.trim();
      
      // Vérifier la ville
      let cityMatch = false;
      if (missionCriteria.city) {
        if (automob.city && automob.city.toLowerCase() === missionCriteria.city.toLowerCase()) {
          cityMatch = true;
        }
        
        if (automob.work_areas) {
          try {
            const workAreas = JSON.parse(automob.work_areas);
            if (Array.isArray(workAreas)) {
              cityMatch = cityMatch || workAreas.some(area => 
                area.toLowerCase().includes(missionCriteria.city.toLowerCase()) || 
                missionCriteria.city.toLowerCase().includes(area.toLowerCase())
              );
            }
          } catch (e) {
            // Ignorer l'erreur de parsing
          }
        }
      } else {
        cityMatch = true;
      }
      
      // Vérifier la disponibilité
      let availabilityMatch = false;
      if (missionCriteria.start_date) {
        const missionStartDate = new Date(missionCriteria.start_date);
        
        if (automob.availability_start_date && automob.availability_end_date) {
          const availStart = new Date(automob.availability_start_date);
          const availEnd = new Date(automob.availability_end_date);
          availabilityMatch = missionStartDate >= availStart && missionStartDate <= availEnd;
        } else {
          availabilityMatch = true;
        }
      } else {
        availabilityMatch = true;
      }
      
      const isEligible = cityMatch && availabilityMatch;
      
      if (isEligible) {
        eligibleCount++;
        
        let webPushStatus = '❌ Désactivé';
        if (automob.web_push_enabled) {
          webPushEnabledCount++;
          if (automob.web_push_subscription) {
            webPushWithSubscriptionCount++;
            webPushStatus = '✅ Activé + Souscription';
          } else {
            webPushStatus = '⚠️ Activé sans souscription';
          }
        }
        
        console.log(`   ✅ ${fullName} (${automob.email})`);
        console.log(`      Ville: ${automob.city || 'Non définie'} | Web Push: ${webPushStatus}`);
      } else {
        console.log(`   ❌ ${fullName} (${automob.email}) - Non éligible`);
        console.log(`      Ville: ${cityMatch ? '✅' : '❌'} | Disponibilité: ${availabilityMatch ? '✅' : '❌'}`);
      }
    }
    
    console.log('\n📊 Résumé:');
    console.log(`   - ${automobs.length} automobs avec les bonnes compétences`);
    console.log(`   - ${eligibleCount} automobs éligibles (ville + disponibilité)`);
    console.log(`   - ${webPushEnabledCount} ont Web Push activé`);
    console.log(`   - ${webPushWithSubscriptionCount} ont une souscription Web Push`);
    
    console.log('\n🎯 Résultat attendu lors de la publication:');
    console.log(`   - ${eligibleCount} notifications créées en BD`);
    console.log(`   - ${webPushWithSubscriptionCount} Web Push envoyés`);
    
    if (webPushWithSubscriptionCount > 0) {
      console.log('\n✅ Le système Web Push fonctionnera correctement !');
    } else {
      console.log('\n⚠️ Aucun automob ne recevra de Web Push');
      console.log('💡 Les automobs doivent activer les Web Push dans leurs paramètres');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

testMissionNotifications();

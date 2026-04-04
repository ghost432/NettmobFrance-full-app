/**
 * Test mission Boss Lady - Vérifier éligibilité et notifications
 */

import dotenv from 'dotenv';
import db from './config/database.js';
import MissionNotificationService from './services/missionNotificationService.js';

dotenv.config();

console.log('\n🔍 ========== TEST MISSION BOSS LADY ==========\n');

async function checkFCMTable() {
  console.log('📊 [1/5] Vérification structure table fcm_tokens...\n');
  
  try {
    const [columns] = await db.query(`
      SHOW COLUMNS FROM fcm_tokens
    `);
    
    console.log('Colonnes disponibles dans fcm_tokens:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    
    const hasDeviceType = columns.some(col => col.Field === 'device_type');
    
    if (!hasDeviceType) {
      console.log('\n⚠️ Colonne "device_type" manquante');
      console.log('   Création de la colonne...');
      
      await db.query(`
        ALTER TABLE fcm_tokens 
        ADD COLUMN device_type VARCHAR(50) DEFAULT 'web' AFTER token
      `);
      
      console.log('   ✅ Colonne device_type ajoutée\n');
    } else {
      console.log('   ✅ Colonne device_type existe\n');
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification table:', error.message);
  }
}

async function findClient() {
  console.log('👤 [2/5] Recherche client antoinepaulcm@gmail.com...\n');
  
  try {
    const [clients] = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        cp.company_name,
        cp.first_name,
        cp.last_name
      FROM users u
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE u.email = 'antoinepaulcm@gmail.com'
    `);
    
    if (clients.length === 0) {
      console.log('❌ Client non trouvé\n');
      return null;
    }
    
    const client = clients[0];
    console.log(`✅ Client trouvé:`);
    console.log(`   ID: ${client.id}`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Rôle: ${client.role}`);
    console.log(`   Entreprise: ${client.company_name || 'Non définie'}`);
    console.log(`   Nom: ${client.first_name} ${client.last_name || ''}\n`);
    
    return client;
    
  } catch (error) {
    console.error('❌ Erreur recherche client:', error.message);
    return null;
  }
}

async function findBossLadyMission(clientId) {
  console.log('🎯 [3/5] Recherche mission "Boss Lady"...\n');
  
  try {
    const [missions] = await db.query(`
      SELECT 
        m.id,
        m.mission_name,
        m.city,
        m.hourly_rate,
        m.start_date,
        m.end_date,
        m.status,
        m.secteur_id,
        m.created_at
      FROM missions m
      WHERE m.client_id = ?
        AND (m.mission_name LIKE '%boss%' OR m.mission_name LIKE '%lady%')
      ORDER BY m.created_at DESC
      LIMIT 5
    `, [clientId]);
    
    if (missions.length === 0) {
      console.log('⚠️ Aucune mission "Boss Lady" trouvée pour ce client');
      console.log('   Recherche de toutes les missions du client...\n');
      
      const [allMissions] = await db.query(`
        SELECT id, mission_name, city, status, created_at
        FROM missions
        WHERE client_id = ?
        ORDER BY created_at DESC
        LIMIT 5
      `, [clientId]);
      
      if (allMissions.length === 0) {
        console.log('❌ Aucune mission trouvée pour ce client\n');
        return null;
      }
      
      console.log(`📋 Missions disponibles (${allMissions.length}):`);
      allMissions.forEach((m, i) => {
        console.log(`   ${i+1}. [${m.id}] ${m.mission_name} - ${m.city} (${m.status})`);
      });
      console.log('\n⚠️ Utilisez la première mission pour le test\n');
      
      return allMissions[0];
    }
    
    const mission = missions[0];
    console.log(`✅ Mission trouvée:`);
    console.log(`   ID: ${mission.id}`);
    console.log(`   Nom: ${mission.mission_name}`);
    console.log(`   Ville: ${mission.city}`);
    console.log(`   Tarif: ${mission.hourly_rate}€/h`);
    console.log(`   Dates: ${new Date(mission.start_date).toLocaleDateString('fr-FR')} → ${new Date(mission.end_date).toLocaleDateString('fr-FR')}`);
    console.log(`   Statut: ${mission.status}`);
    console.log(`   Secteur ID: ${mission.secteur_id}\n`);
    
    return mission;
    
  } catch (error) {
    console.error('❌ Erreur recherche mission:', error.message);
    return null;
  }
}

async function checkEligibleAutomobs(mission) {
  console.log('👥 [4/5] Recherche automobs éligibles...\n');
  
  try {
    // Récupérer les compétences de la mission
    const [competences] = await db.query(`
      SELECT competence_id 
      FROM mission_competences 
      WHERE mission_id = ?
    `, [mission.id]);
    
    const competencesIds = competences.map(c => c.competence_id);
    
    if (competencesIds.length === 0) {
      console.log('⚠️ Aucune compétence liée à cette mission\n');
      return [];
    }
    
    console.log(`📋 Compétences requises: ${competencesIds.join(', ')}`);
    
    // Utiliser la fonction du service
    const eligibleAutomobs = await MissionNotificationService.findEligibleAutomobs(
      mission, 
      competencesIds
    );
    
    console.log(`\n✅ ${eligibleAutomobs.length} automobs éligibles trouvés\n`);
    
    if (eligibleAutomobs.length > 0) {
      console.log('📋 Détails automobs éligibles:\n');
      
      eligibleAutomobs.forEach((automob, index) => {
        console.log(`${index + 1}. Automob #${automob.id}`);
        console.log(`   Nom: ${automob.first_name} ${automob.last_name || ''}`);
        console.log(`   Email: ${automob.email}`);
        console.log(`   Ville: ${automob.city || 'Non définie'}`);
        
        let workAreas = 'Non définies';
        if (automob.work_areas) {
          try {
            const areas = typeof automob.work_areas === 'string' 
              ? JSON.parse(automob.work_areas) 
              : automob.work_areas;
            workAreas = Array.isArray(areas) 
              ? areas.map(a => typeof a === 'object' ? (a.city || a.name) : a).join(', ')
              : 'Format invalide';
          } catch (e) {
            workAreas = 'Erreur parsing';
          }
        }
        console.log(`   Zones travail: ${workAreas}`);
        console.log(`   Téléphone: ${automob.profile_phone || 'Non défini'}`);
        console.log(`   SMS activés: ${automob.sms_notifications === 1 ? '✅' : '❌'}`);
        console.log(`   Web Push: ${automob.web_push_enabled === 1 ? '✅' : '❌'}`);
        console.log(`   Vérifié: ${automob.id_verified === 1 ? '✅' : '❌'}`);
        console.log('');
      });
    }
    
    return eligibleAutomobs;
    
  } catch (error) {
    console.error('❌ Erreur recherche automobs éligibles:', error);
    return [];
  }
}

async function testNotifications(mission, client, eligibleAutomobs) {
  console.log('📬 [5/5] Test envoi notifications...\n');
  
  if (eligibleAutomobs.length === 0) {
    console.log('⚠️ Aucun automob éligible, impossible de tester les notifications\n');
    return;
  }
  
  try {
    // Récupérer les compétences
    const [competences] = await db.query(`
      SELECT competence_id 
      FROM mission_competences 
      WHERE mission_id = ?
    `, [mission.id]);
    
    const competencesIds = competences.map(c => c.competence_id);
    
    console.log('🚀 Envoi des notifications à tous les automobs éligibles...\n');
    
    // Utiliser le service unifié
    const results = await MissionNotificationService.publishMissionNotifications(
      mission,
      client,
      competencesIds,
      null // pas de Socket.IO en mode test
    );
    
    console.log('\n📊 ========== RÉSULTATS ==========\n');
    console.log(`✅ Automobs éligibles: ${results.eligible_automobs}`);
    console.log(`📲 Notifications in-app: ${results.notifications_sent}`);
    console.log(`🔔 Web Push: ${results.web_push_sent}`);
    console.log(`🔥 FCM Mobile: ${results.fcm_sent}`);
    console.log(`📧 Emails: ${results.emails_sent}`);
    console.log(`📱 SMS: ${results.sms_sent}`);
    
    if (results.errors && results.errors.length > 0) {
      console.log(`\n⚠️ ${results.errors.length} erreurs:`);
      results.errors.forEach(err => {
        console.log(`   ❌ ${err.type}: ${err.message}`);
      });
    }
    
    console.log('\n🎉 Test terminé !\n');
    
  } catch (error) {
    console.error('❌ Erreur envoi notifications:', error);
    console.error('Stack:', error.stack);
  }
}

async function main() {
  try {
    // 1. Vérifier/Corriger table FCM
    await checkFCMTable();
    
    // 2. Trouver le client
    const client = await findClient();
    if (!client) {
      console.log('❌ Impossible de continuer sans client\n');
      process.exit(1);
    }
    
    // 3. Trouver la mission Boss Lady
    const mission = await findBossLadyMission(client.id);
    if (!mission) {
      console.log('❌ Impossible de continuer sans mission\n');
      process.exit(1);
    }
    
    // 4. Trouver automobs éligibles
    const eligibleAutomobs = await checkEligibleAutomobs(mission);
    
    // 5. Tester notifications
    await testNotifications(mission, client, eligibleAutomobs);
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

main();

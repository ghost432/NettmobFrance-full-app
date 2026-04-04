import MissionNotificationService from './services/missionNotificationService.js';
import db from './config/database.js';

/**
 * Test du nouveau système expert de notifications pour missions automob
 */
async function testExpertNotificationSystem() {
  console.log('🔬 [TEST] Démarrage test système expert notifications missions');
  
  try {
    // 1. Récupérer une mission de test existante
    const [missions] = await db.query(`
      SELECT * FROM missions 
      WHERE status = 'ouvert' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (missions.length === 0) {
      console.log('⚠️ [TEST] Aucune mission ouverte trouvée pour le test');
      return;
    }
    
    const mission = missions[0];
    console.log(`📋 [TEST] Mission sélectionnée: ${mission.mission_name} (ID: ${mission.id})`);
    
    // 2. Récupérer le client
    const [clients] = await db.query(
      'SELECT company_name FROM client_profiles WHERE user_id = ?',
      [mission.client_id]
    );
    
    const clientData = {
      id: mission.client_id,
      company_name: clients[0]?.company_name || 'Client Test'
    };
    
    // 3. Récupérer les compétences de la mission
    const [competences] = await db.query(
      'SELECT competence_id FROM mission_competences WHERE mission_id = ?',
      [mission.id]
    );
    
    const competencesIds = competences.map(c => c.competence_id);
    
    if (competencesIds.length === 0) {
      console.log('⚠️ [TEST] Aucune compétence trouvée pour la mission');
      return;
    }
    
    console.log(`🔧 [TEST] ${competencesIds.length} compétences trouvées: ${competencesIds.join(', ')}`);
    
    // 4. Tester le système de publication
    const missionData = {
      id: mission.id,
      mission_name: mission.mission_name || 'Mission Test',
      hourly_rate: mission.hourly_rate || 20,
      city: mission.city || 'Paris',
      secteur_id: mission.secteur_id || 1,
      description: mission.description || 'Description test',
      start_date: mission.start_date || new Date(),
      end_date: mission.end_date || new Date(Date.now() + 24*60*60*1000),
      client_id: mission.client_id
    };
    
    console.log('🚀 [TEST] Lancement test notifications...');
    
    const results = await MissionNotificationService.publishMissionNotifications(
      missionData,
      clientData,
      competencesIds,
      null // pas de Socket.IO pour le test
    );
    
    // 5. Afficher les résultats
    console.log('\n📊 [TEST] RÉSULTATS DU TEST:');
    console.log(`   ✅ Automobs éligibles trouvés: ${results.eligible_automobs}`);
    console.log(`   📱 Notifications in-app: ${results.notifications_sent}`);
    console.log(`   🔔 Web Push envoyés: ${results.web_push_sent}`);
    console.log(`   🔥 FCM envoyés: ${results.fcm_sent}`);
    console.log(`   📧 Emails envoyés: ${results.emails_sent}`);
    console.log(`   📱 SMS envoyés: ${results.sms_sent}`);
    console.log(`   ❌ Erreurs: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n🚨 [TEST] ERREURS DÉTECTÉES:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.type}] ${error.message}`);
      });
    }
    
    // 6. Vérifications supplémentaires
    if (results.eligible_automobs === 0) {
      console.log('\n⚠️ [TEST] ATTENTION: Aucun automob éligible trouvé');
      console.log('   - Vérifiez les compétences requises');
      console.log('   - Vérifiez la localisation de la mission');
      console.log('   - Vérifiez les automobs vérifiés en base');
    }
    
    if (results.web_push_sent === 0 && results.eligible_automobs > 0) {
      console.log('\n⚠️ [TEST] ATTENTION: Aucun Web Push envoyé');
      console.log('   - Vérifiez la configuration VAPID');
      console.log('   - Vérifiez les souscriptions Web Push des automobs');
    }
    
    if (results.fcm_sent === 0 && results.eligible_automobs > 0) {
      console.log('\n⚠️ [TEST] ATTENTION: Aucun FCM envoyé');
      console.log('   - Vérifiez la configuration Firebase');
      console.log('   - Vérifiez les tokens FCM des automobs');
    }
    
    if (results.sms_sent === 0 && results.eligible_automobs > 0) {
      console.log('\n⚠️ [TEST] ATTENTION: Aucun SMS envoyé');
      console.log('   - Vérifiez la configuration Twilio');
      console.log('   - Vérifiez les numéros de téléphone des automobs');
    }
    
    console.log('\n✅ [TEST] Test terminé avec succès');
    
  } catch (error) {
    console.error('\n❌ [TEST] Erreur pendant le test:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Fermer la connexion DB
    await db.end();
  }
}

// Lancer le test
testExpertNotificationSystem();

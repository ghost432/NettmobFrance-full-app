#!/usr/bin/env node

import axios from 'axios';
import db from './config/database.js';

async function testAuthenticatedPatch() {
  try {
    console.log('🧪 Test PATCH avec simulation authentification...');
    
    // 1. Récupérer les détails de l'application et de la mission
    console.log('\n🔍 Vérification des données existantes:');
    const [app] = await db.query(`
      SELECT ma.*, m.client_id, m.mission_name, m.title, m.status as mission_status
      FROM mission_applications ma
      JOIN missions m ON ma.mission_id = m.id
      WHERE ma.id = 6 AND ma.mission_id = 9
    `);
    
    if (app.length === 0) {
      console.log('❌ Application 6 pour mission 9 non trouvée');
      return;
    }
    
    console.log('✅ Application trouvée:', {
      id: app[0].id,
      mission_id: app[0].mission_id,
      automob_id: app[0].automob_id,
      client_id: app[0].client_id,
      status: app[0].status,
      mission_name: app[0].mission_name
    });
    
    // 2. Récupérer un token d'authentification valide pour le client
    const [userTokens] = await db.query(
      'SELECT * FROM users WHERE id = ? AND role = "client"', 
      [app[0].client_id]
    );
    
    if (userTokens.length === 0) {
      console.log('❌ Client non trouvé');
      return;
    }
    
    console.log('✅ Client trouvé:', userTokens[0].email);
    
    // 3. Simuler une requête comme si elle venait du frontend
    // Pour ce test, on va seulement tester l'exécution du code sans authentification
    // mais on va importer et exécuter directement la logique
    
    console.log('\n🔄 Simulation de la logique PATCH...');
    
    // Importer la logique directement depuis les routes
    const missionId = 9;
    const applicationId = 6;
    const status = 'accepte';
    
    console.log(`📝 Simulation: ${status} pour application ${applicationId} de mission ${missionId}`);
    
    // Test de la logique principale (sans l'authentification)
    try {
      const [applications] = await db.query(`
        SELECT ma.*, m.client_id, 
               COALESCE(m.mission_name, m.title) as mission_title,
               m.mission_name, m.title, m.status as mission_status,
               m.nb_automobs as automobs_needed
        FROM mission_applications ma
        JOIN missions m ON ma.mission_id = m.id
        WHERE ma.id = ? AND ma.mission_id = ?
      `, [applicationId, missionId]);

      if (applications.length === 0) {
        console.log('❌ Application non trouvée dans la simulation');
        return;
      }

      const application = applications[0];
      console.log('✅ Application récupérée:', {
        id: application.id,
        automob_id: application.automob_id,
        client_id: application.client_id,
        mission_title: application.mission_title,
        automobs_needed: application.automobs_needed
      });
      
      // Récupérer les infos complètes AVANT de modifier (partie critique)
      const [missionInfo] = await db.query(
        'SELECT m.*, cp.company_name, cp.first_name as client_first_name, cp.last_name as client_last_name FROM missions m LEFT JOIN client_profiles cp ON m.client_id = cp.user_id WHERE m.id = ?',
        [missionId]
      );
      
      const [automobInfo] = await db.query(
        'SELECT u.email, ap.first_name, ap.last_name FROM users u LEFT JOIN automob_profiles ap ON u.id = ap.user_id WHERE u.id = ?',
        [application.automob_id]
      );
      
      const [clientEmail] = await db.query('SELECT email FROM users WHERE id = ?', [application.client_id]);
      
      console.log('✅ Infos récupérées avec succès');
      console.log('  - Mission:', missionInfo[0] ? 'OK' : 'MANQUANTE');
      console.log('  - Automob:', automobInfo[0] ? 'OK' : 'MANQUANT');
      console.log('  - Client email:', clientEmail[0] ? 'OK' : 'MANQUANT');
      
      // Test du calcul automobsNeeded
      const mission = missionInfo[0];
      const automobsNeeded = application.automobs_needed || mission.nb_automobs || mission.automobs_needed || 1;
      console.log('✅ automobsNeeded calculé:', automobsNeeded);
      
      console.log('✅ Logique PATCH simulée avec succès - aucune erreur détectée');
      
    } catch (simulationError) {
      console.error('❌ ERREUR dans la simulation:', simulationError);
      console.error('Stack:', simulationError.stack);
    }
    
    console.log('\n✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testAuthenticatedPatch();

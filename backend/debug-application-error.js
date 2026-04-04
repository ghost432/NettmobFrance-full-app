#!/usr/bin/env node

import db from './config/database.js';

async function debugApplicationError() {
  try {
    console.log('🔍 Débogage de l\'erreur applications...');
    
    // 1. Vérifier la structure de la table mission_applications
    console.log('\n📋 Structure table mission_applications:');
    const [columns] = await db.query('SHOW COLUMNS FROM mission_applications');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `= ${col.Default}` : ''}`);
    });
    
    // 2. Vérifier s'il y a une application avec ID 6 pour mission 9
    console.log('\n🔍 Recherche application ID 6 pour mission 9:');
    const [app] = await db.query(`
      SELECT ma.*, m.client_id, m.mission_name, m.title, m.status as mission_status
      FROM mission_applications ma
      JOIN missions m ON ma.mission_id = m.id
      WHERE ma.id = 6 AND ma.mission_id = 9
    `);
    
    if (app.length > 0) {
      console.log('✅ Application trouvée:', app[0]);
    } else {
      console.log('❌ Aucune application trouvée avec ID 6 pour mission 9');
      
      // Chercher d'autres applications pour mission 9
      const [otherApps] = await db.query(`
        SELECT ma.id, ma.mission_id, ma.automob_id, ma.status
        FROM mission_applications ma
        WHERE ma.mission_id = 9
      `);
      console.log('📋 Applications existantes pour mission 9:', otherApps);
      
      // Chercher l'application avec ID 6 (quelque soit la mission)
      const [app6] = await db.query(`
        SELECT ma.*, m.mission_name
        FROM mission_applications ma
        JOIN missions m ON ma.mission_id = m.id
        WHERE ma.id = 6
      `);
      console.log('📋 Application ID 6 (quelque soit la mission):', app6);
    }
    
    // 3. Vérifier la structure de la table missions
    console.log('\n📋 Structure table missions:');
    const [missionCols] = await db.query('SHOW COLUMNS FROM missions');
    const missionColNames = missionCols.map(col => col.Field);
    console.log('Colonnes missions:', missionColNames);
    
    // 4. Vérifier si la mission 9 existe
    console.log('\n🔍 Recherche mission ID 9:');
    const [mission] = await db.query('SELECT * FROM missions WHERE id = 9');
    if (mission.length > 0) {
      console.log('✅ Mission 9 trouvée:', {
        id: mission[0].id,
        mission_name: mission[0].mission_name,
        title: mission[0].title,
        client_id: mission[0].client_id,
        status: mission[0].status,
        nb_automobs: mission[0].nb_automobs,
        automobs_needed: mission[0].automobs_needed
      });
    } else {
      console.log('❌ Mission 9 non trouvée');
    }
    
    // 5. Lister les applications récentes pour voir les données
    console.log('\n📋 10 dernières applications:');
    const [recentApps] = await db.query(`
      SELECT ma.id, ma.mission_id, ma.automob_id, ma.status, ma.created_at,
             m.mission_name, m.title
      FROM mission_applications ma
      JOIN missions m ON ma.mission_id = m.id
      ORDER BY ma.created_at DESC
      LIMIT 10
    `);
    console.table(recentApps);
    
    console.log('\n✅ Débogage terminé');
    
  } catch (error) {
    console.error('❌ Erreur pendant le débogage:', error);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

debugApplicationError();

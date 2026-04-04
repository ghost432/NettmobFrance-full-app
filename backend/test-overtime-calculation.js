#!/usr/bin/env node

import axios from 'axios';
import db from './config/database.js';

async function testOvertimeCalculation() {
  try {
    console.log('🧪 Test du nouveau calcul des heures supplémentaires...');
    
    // 1. Trouver une mission avec des heures définies
    console.log('\n📋 Recherche d\'une mission test...');
    const [missions] = await db.query(`
      SELECT m.id, m.mission_name, m.max_hours, m.total_hours, m.billing_frequency,
             ma.automob_id
      FROM missions m
      JOIN mission_applications ma ON m.id = ma.mission_id
      WHERE ma.status = 'accepte' 
      AND (m.max_hours > 0 OR m.total_hours > 0)
      LIMIT 1
    `);
    
    if (missions.length === 0) {
      console.log('❌ Aucune mission avec heures définies trouvée');
      return;
    }
    
    const mission = missions[0];
    const missionHours = mission.max_hours || mission.total_hours || 0;
    
    console.log(`✅ Mission test: "${mission.mission_name}"`);
    console.log(`   Heures normales: ${missionHours}h`);
    console.log(`   Automob ID: ${mission.automob_id}`);
    
    // 2. Trouver une feuille de temps pour cette mission
    const [timesheets] = await db.query(`
      SELECT ts.*, 
             m.max_hours, m.total_hours as mission_total_hours
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id
      WHERE ts.mission_id = ? AND ts.automob_id = ?
      LIMIT 1
    `, [mission.id, mission.automob_id]);
    
    let timesheetId;
    if (timesheets.length > 0) {
      timesheetId = timesheets[0].id;
      console.log(`✅ Feuille de temps existante trouvée: ID ${timesheetId}`);
    } else {
      console.log('📝 Création d\'une feuille de temps test...');
      const today = new Date().toISOString().split('T')[0];
      const [result] = await db.query(
        'INSERT INTO timesheets (mission_id, automob_id, period_type, period_start, period_end) VALUES (?, ?, ?, ?, ?)',
        [mission.id, mission.automob_id, 'semaine', today, today]
      );
      timesheetId = result.insertId;
      console.log(`✅ Feuille de temps créée: ID ${timesheetId}`);
    }
    
    // 3. Test du calcul - scénario 1: Heures normales (pas de supplémentaires)
    console.log('\n📋 Test 1: Heures normales (pas de supplémentaires)');
    
    // Supprimer les entrées existantes pour un test propre
    await db.query('DELETE FROM timesheet_entries WHERE timesheet_id = ?', [timesheetId]);
    
    // Ajouter exactement les heures normales
    const normalHours = Math.min(missionHours, 8); // Maximum 8h par jour pour le test
    await db.query(
      `INSERT INTO timesheet_entries 
       (timesheet_id, work_date, start_time, end_time, hours_worked, is_overtime) 
       VALUES (?, ?, '09:00', '17:00', ?, FALSE)`,
      [timesheetId, new Date().toISOString().split('T')[0], normalHours]
    );
    
    // Déclencher le recalcul comme le ferait l'API
    const [missionInfo] = await db.query(`
      SELECT m.max_hours, m.total_hours as mission_total_hours
      FROM missions m 
      JOIN timesheets ts ON m.id = ts.mission_id 
      WHERE ts.id = ?
    `, [timesheetId]);
    
    const calculatedMissionHours = missionInfo[0]?.max_hours || missionInfo[0]?.mission_total_hours || 0;
    
    await db.query(
      `UPDATE timesheets SET 
       total_hours = (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?),
       overtime_hours = GREATEST(0, 
         (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?) - ?
       )
       WHERE id = ?`,
      [timesheetId, timesheetId, calculatedMissionHours, timesheetId]
    );
    
    // Vérifier le résultat
    const [result1] = await db.query('SELECT total_hours, overtime_hours FROM timesheets WHERE id = ?', [timesheetId]);
    console.log(`   Heures travaillées: ${result1[0].total_hours}h`);
    console.log(`   Heures supplémentaires: ${result1[0].overtime_hours}h`);
    console.log(`   ✅ ${result1[0].overtime_hours == 0 ? 'CORRECT' : 'ERREUR'} - Pas de supplémentaires attendues`);
    
    // 4. Test du calcul - scénario 2: Heures supplémentaires
    console.log('\n📋 Test 2: Avec heures supplémentaires');
    
    // Supprimer et ajouter plus d'heures que la mission
    await db.query('DELETE FROM timesheet_entries WHERE timesheet_id = ?', [timesheetId]);
    
    const totalWorkedHours = missionHours + 3; // +3h supplémentaires
    await db.query(
      `INSERT INTO timesheet_entries 
       (timesheet_id, work_date, start_time, end_time, hours_worked, is_overtime) 
       VALUES (?, ?, '09:00', '18:00', ?, FALSE)`,
      [timesheetId, new Date().toISOString().split('T')[0], totalWorkedHours]
    );
    
    // Recalculer
    await db.query(
      `UPDATE timesheets SET 
       total_hours = (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?),
       overtime_hours = GREATEST(0, 
         (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?) - ?
       )
       WHERE id = ?`,
      [timesheetId, timesheetId, calculatedMissionHours, timesheetId]
    );
    
    const [result2] = await db.query('SELECT total_hours, overtime_hours FROM timesheets WHERE id = ?', [timesheetId]);
    const expectedOvertime = Math.max(0, totalWorkedHours - missionHours);
    
    console.log(`   Mission prévue: ${missionHours}h`);
    console.log(`   Heures travaillées: ${result2[0].total_hours}h`);
    console.log(`   Heures supplémentaires: ${result2[0].overtime_hours}h`);
    console.log(`   Attendu: ${expectedOvertime}h`);
    console.log(`   ✅ ${result2[0].overtime_hours == expectedOvertime ? 'CORRECT' : 'ERREUR'} - Calcul heures supplémentaires`);
    
    // 5. Test avec plusieurs entrées
    console.log('\n📋 Test 3: Plusieurs entrées (simulation semaine 42h → 45h)');
    
    await db.query('DELETE FROM timesheet_entries WHERE timesheet_id = ?', [timesheetId]);
    
    // Simuler une semaine de 42h mission → 45h travaillées = 3h supplémentaires
    const weeklyMissionHours = 42;
    const weeklyWorkedHours = 45;
    
    // Mise à jour temporaire de la mission pour le test
    await db.query('UPDATE missions SET max_hours = ? WHERE id = ?', [weeklyMissionHours, mission.id]);
    
    // Ajouter 5 jours de travail
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // 4 jours normaux (8.5h) + 1 jour avec 11h
    for (let i = 0; i < 4; i++) {
      await db.query(
        `INSERT INTO timesheet_entries 
         (timesheet_id, work_date, start_time, end_time, hours_worked, is_overtime) 
         VALUES (?, ?, '09:00', '17:30', 8.5, FALSE)`,
        [timesheetId, dates[i]]
      );
    }
    
    // Dernier jour avec heures supplémentaires
    await db.query(
      `INSERT INTO timesheet_entries 
       (timesheet_id, work_date, start_time, end_time, hours_worked, is_overtime) 
       VALUES (?, ?, '09:00', '20:00', 11, FALSE)`,
      [timesheetId, dates[4]]
    );
    
    // Recalculer avec nouvelles heures mission
    await db.query(
      `UPDATE timesheets SET 
       total_hours = (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?),
       overtime_hours = GREATEST(0, 
         (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?) - ?
       )
       WHERE id = ?`,
      [timesheetId, timesheetId, weeklyMissionHours, timesheetId]
    );
    
    const [result3] = await db.query('SELECT total_hours, overtime_hours FROM timesheets WHERE id = ?', [timesheetId]);
    
    console.log(`   Mission semaine: ${weeklyMissionHours}h`);
    console.log(`   Heures travaillées: ${result3[0].total_hours}h`);
    console.log(`   Heures supplémentaires: ${result3[0].overtime_hours}h`);
    console.log(`   Attendu: 3h (${weeklyWorkedHours} - ${weeklyMissionHours})`);
    console.log(`   ✅ ${result3[0].overtime_hours == 3 ? 'CORRECT' : 'ERREUR'} - Calcul semaine complète`);
    
    console.log('\n✅ TOUS LES TESTS TERMINÉS');
    console.log('📋 Nouveau calcul: Heures supplémentaires = MAX(0, total_travaillé - heures_mission)');
    
  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n📋 Tests terminés');
    process.exit(0);
  }
}

testOvertimeCalculation();

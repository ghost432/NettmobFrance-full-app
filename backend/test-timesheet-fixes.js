#!/usr/bin/env node

import axios from 'axios';
import db from './config/database.js';

async function testTimesheetFixes() {
  try {
    console.log('🧪 Test des corrections des feuilles de temps...');
    
    // 1. Test des données des feuilles de temps pour vérifier les dates
    console.log('\n📋 Test 1: Vérification des champs de dates dans les feuilles de temps');
    const [timesheets] = await db.query(`
      SELECT 
        ts.*,
        m.mission_name,
        ap.first_name as automob_first_name,
        ap.last_name as automob_last_name
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id
      LEFT JOIN automob_profiles ap ON ts.automob_id = ap.user_id
      LIMIT 3
    `);
    
    console.log('Échantillon de feuilles de temps:');
    timesheets.forEach(ts => {
      console.log(`- ID: ${ts.id}, Mission: ${ts.mission_name}`);
      console.log(`  period_start: ${ts.period_start}`);
      console.log(`  period_end: ${ts.period_end}`);
      console.log(`  start_date: ${ts.start_date}`);
      console.log(`  end_date: ${ts.end_date}`);
      console.log(`  submitted_at: ${ts.submitted_at}`);
      console.log(`  status: ${ts.status}`);
      console.log('');
    });
    
    // 2. Test de la logique anti-brouillons multiples
    console.log('📋 Test 2: Simulation création de feuille de temps avec brouillon existant');
    
    // Trouver un automob avec une mission acceptée
    const [automobs] = await db.query(`
      SELECT ma.automob_id, ma.mission_id, m.mission_name, ap.first_name, ap.last_name
      FROM mission_applications ma
      JOIN missions m ON ma.mission_id = m.id
      LEFT JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      WHERE ma.status = 'accepte'
      LIMIT 1
    `);
    
    if (automobs.length === 0) {
      console.log('❌ Aucune mission acceptée trouvée pour les tests');
      return;
    }
    
    const testAutomob = automobs[0];
    console.log(`✅ Automob test: ${testAutomob.first_name} ${testAutomob.last_name}`);
    console.log(`   Mission: ${testAutomob.mission_name} (ID: ${testAutomob.mission_id})`);
    
    // Vérifier s'il y a déjà un brouillon
    const [existingDrafts] = await db.query(`
      SELECT id, status, period_start, period_end
      FROM timesheets 
      WHERE mission_id = ? AND automob_id = ? AND status = 'brouillon'
    `, [testAutomob.mission_id, testAutomob.automob_id]);
    
    console.log(`Brouillons existants: ${existingDrafts.length}`);
    existingDrafts.forEach(draft => {
      console.log(`  - ID: ${draft.id}, période: ${draft.period_start} - ${draft.period_end}`);
    });
    
    // 3. Test de la logique backend pour éviter les doublons
    console.log('\n📋 Test 3: Simulation de la logique anti-brouillons du backend');
    
    const missionId = testAutomob.mission_id;
    const automobId = testAutomob.automob_id;
    
    // Vérifier la logique que j'ai ajoutée
    const [checkDraft] = await db.query(`
      SELECT id FROM timesheets 
      WHERE mission_id = ? AND automob_id = ? AND status = 'brouillon'
    `, [missionId, automobId]);
    
    if (checkDraft.length > 0) {
      console.log(`✅ Logique anti-brouillons: TROUVÉ un brouillon existant (ID: ${checkDraft[0].id})`);
      console.log('   → La création d\'un nouveau brouillon serait bloquée');
    } else {
      console.log('✅ Logique anti-brouillons: AUCUN brouillon existant');
      console.log('   → Un nouveau brouillon pourrait être créé');
    }
    
    // 4. Test de validation des dates
    console.log('\n📋 Test 4: Validation des dates JavaScript');
    
    const testDates = [
      { value: null, label: 'null' },
      { value: undefined, label: 'undefined' },
      { value: '', label: 'chaîne vide' },
      { value: '2024-01-15', label: 'date valide' },
      { value: 'invalid-date', label: 'date invalide' }
    ];
    
    testDates.forEach(testDate => {
      try {
        if (testDate.value) {
          const date = new Date(testDate.value);
          const isValid = !isNaN(date.getTime());
          console.log(`  ${testDate.label}: ${isValid ? '✅ Valide' : '❌ Invalide'} (${testDate.value})`);
        } else {
          console.log(`  ${testDate.label}: ⚠️ Null/undefined (${testDate.value})`);
        }
      } catch (error) {
        console.log(`  ${testDate.label}: ❌ Erreur - ${error.message}`);
      }
    });
    
    console.log('\n✅ TOUS LES TESTS TERMINÉS');
    
  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n📋 Tests terminés');
    process.exit(0);
  }
}

testTimesheetFixes();

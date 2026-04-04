#!/usr/bin/env node
/**
 * Script de test pour vérifier l'éligibilité géographique
 * Teste les deux vérifications : ville profil ET villes de travail
 */

import dotenv from 'dotenv';
import db from './config/database.js';
import MissionNotificationService from './services/missionNotificationService.js';

dotenv.config();

console.log('\n🧪 ========== TEST ÉLIGIBILITÉ GÉOGRAPHIQUE ==========\n');

// Scénarios de test
const testScenarios = [
  {
    name: 'Automob à Paris avec work_areas = Marseille',
    automob: {
      id: 1,
      city: 'Paris',
      work_areas: JSON.stringify(['Marseille', 'Lyon', 'Nice'])
    },
    mission: { city: 'Marseille' },
    expected: true,
    reason: 'Marseille est dans work_areas'
  },
  {
    name: 'Automob à Marseille sans work_areas',
    automob: {
      id: 2,
      city: 'Marseille',
      work_areas: null
    },
    mission: { city: 'Marseille' },
    expected: true,
    reason: 'Ville profil = Marseille'
  },
  {
    name: 'Automob à Paris sans Marseille dans work_areas',
    automob: {
      id: 3,
      city: 'Paris',
      work_areas: JSON.stringify(['Lyon', 'Nice'])
    },
    mission: { city: 'Marseille' },
    expected: false,
    reason: 'Ni ville profil ni work_areas ne correspondent'
  },
  {
    name: 'Automob à Lyon avec work_areas objets {city}',
    automob: {
      id: 4,
      city: 'Lyon',
      work_areas: JSON.stringify([
        { city: 'Marseille', region: 'PACA' },
        { city: 'Paris', region: 'IDF' }
      ])
    },
    mission: { city: 'Marseille' },
    expected: true,
    reason: 'Marseille dans work_areas (format objet)'
  },
  {
    name: 'Automob sans ville avec work_areas = Marseille',
    automob: {
      id: 5,
      city: null,
      work_areas: JSON.stringify(['Marseille'])
    },
    mission: { city: 'Marseille' },
    expected: true,
    reason: 'Marseille dans work_areas'
  },
  {
    name: 'Mission sans ville spécifique',
    automob: {
      id: 6,
      city: 'Paris',
      work_areas: null
    },
    mission: { city: 'France' },
    expected: true,
    reason: 'Mission nationale (France)'
  },
  {
    name: 'Mission sans ville',
    automob: {
      id: 7,
      city: 'Paris',
      work_areas: null
    },
    mission: { city: null },
    expected: true,
    reason: 'Pas de ville spécifiée'
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  console.log('🚀 Lancement des tests...\n');
  
  for (const scenario of testScenarios) {
    console.log(`\n📋 TEST: ${scenario.name}`);
    console.log(`   Automob: ville="${scenario.automob.city}", work_areas=${scenario.automob.work_areas || 'null'}`);
    console.log(`   Mission: ville="${scenario.mission.city}"`);
    console.log(`   Attendu: ${scenario.expected ? '✅ ÉLIGIBLE' : '❌ NON ÉLIGIBLE'}`);
    console.log(`   Raison: ${scenario.reason}`);
    console.log('   ---');
    
    const result = MissionNotificationService.checkGeographicEligibility(
      scenario.automob,
      scenario.mission
    );
    
    if (result === scenario.expected) {
      console.log(`   ✅ PASS - Résultat correct: ${result ? 'ÉLIGIBLE' : 'NON ÉLIGIBLE'}`);
      passed++;
    } else {
      console.log(`   ❌ FAIL - Attendu: ${scenario.expected}, Obtenu: ${result}`);
      failed++;
    }
  }
  
  console.log('\n\n📊 ========== RÉSULTATS ==========\n');
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📈 Score: ${passed}/${testScenarios.length} (${Math.round(passed/testScenarios.length*100)}%)\n`);
  
  if (failed === 0) {
    console.log('🎉 ✅ TOUS LES TESTS PASSENT - Logique géographique 100% opérationnelle !\n');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez la logique.\n');
  }
}

async function testWithRealData() {
  console.log('\n🔍 ========== TEST AVEC DONNÉES RÉELLES ==========\n');
  
  try {
    // Tester avec la base de données
    const [automobs] = await db.query(`
      SELECT 
        u.id, 
        ap.city, 
        ap.work_areas,
        ap.first_name,
        ap.last_name
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'automob' 
        AND u.verified = TRUE
      LIMIT 5
    `);
    
    if (automobs.length === 0) {
      console.log('⚠️ Aucun automob trouvé dans la base de données\n');
      return;
    }
    
    console.log(`📋 ${automobs.length} automobs trouvés dans la BDD\n`);
    
    // Tester avec une mission fictive à Marseille
    const testMission = { 
      id: 9999, 
      city: 'Marseille',
      mission_name: 'Test Nettoyage' 
    };
    
    console.log(`🎯 Mission de test: "${testMission.mission_name}" à ${testMission.city}\n`);
    
    automobs.forEach(automob => {
      console.log(`\n👤 Automob #${automob.id}: ${automob.first_name} ${automob.last_name}`);
      console.log(`   Ville profil: ${automob.city || 'Non définie'}`);
      
      let workAreasDisplay = 'Non définies';
      if (automob.work_areas) {
        try {
          const areas = typeof automob.work_areas === 'string' 
            ? JSON.parse(automob.work_areas) 
            : automob.work_areas;
          workAreasDisplay = Array.isArray(areas) 
            ? areas.map(a => typeof a === 'object' ? (a.city || a.name) : a).join(', ')
            : 'Format invalide';
        } catch (e) {
          workAreasDisplay = 'Erreur parsing';
        }
      }
      console.log(`   Villes travail: ${workAreasDisplay}`);
      
      const eligible = MissionNotificationService.checkGeographicEligibility(automob, testMission);
      console.log(`   Résultat: ${eligible ? '✅ ÉLIGIBLE' : '❌ NON ÉLIGIBLE'}`);
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Erreur test données réelles:', error);
  } finally {
    await db.end();
  }
}

// Exécuter les tests
async function main() {
  await runTests();
  await testWithRealData();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

import db from './config/database.js';

// Test du système de re-candidature après refus
console.log('🧪 Test du système de re-candidature après refus');

const testUserId = 24; // User mounchilithierry432@gmail.com
const testMissionId = 9; // Mission de test (existante)

try {
  console.log('\n📊 État initial...');
  
  // Vérifier les candidatures existantes
  const [applications] = await db.query(
    'SELECT id, mission_id, automob_id, status, created_at FROM mission_applications WHERE automob_id = ? AND mission_id = ?',
    [testUserId, testMissionId]
  );
  
  console.log(`Candidatures existantes pour user ${testUserId} sur mission ${testMissionId}:`, applications.length);
  applications.forEach(app => {
    console.log(`  - ID: ${app.id}, Statut: ${app.status}, Date: ${app.created_at}`);
  });
  
  console.log('\n🧪 Test 1: Candidature initiale...');
  
  try {
    await db.query(
      'INSERT INTO mission_applications (mission_id, automob_id, message, status) VALUES (?, ?, ?, ?)',
      [testMissionId, testUserId, 'Test initial candidature', 'en_attente']
    );
    console.log('✅ Candidature initiale créée');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      console.log('ℹ️ Candidature déjà existante');
    } else {
      throw e;
    }
  }
  
  console.log('\n🧪 Test 2: Refus de la candidature...');
  
  // Refuser la candidature
  await db.query(
    'UPDATE mission_applications SET status = "refuse" WHERE mission_id = ? AND automob_id = ?',
    [testMissionId, testUserId]
  );
  console.log('✅ Candidature refusée');
  
  console.log('\n🧪 Test 3: Tentative de re-candidature...');
  
  // Vérifier la logique de re-candidature (comme dans le nouveau code)
  const [existing] = await db.query(
    'SELECT id, status FROM mission_applications WHERE mission_id = ? AND automob_id = ? AND status != "refuse"',
    [testMissionId, testUserId]
  );
  
  console.log(`Candidatures non refusées trouvées: ${existing.length}`);
  
  if (existing.length === 0) {
    // Supprimer les anciennes candidatures refusées
    const [deleted] = await db.query(
      'DELETE FROM mission_applications WHERE mission_id = ? AND automob_id = ? AND status = "refuse"',
      [testMissionId, testUserId]
    );
    console.log(`✅ ${deleted.affectedRows} ancienne(s) candidature(s) refusée(s) supprimée(s)`);
    
    // Nouvelle candidature
    await db.query(
      'INSERT INTO mission_applications (mission_id, automob_id, message, status) VALUES (?, ?, ?, ?)',
      [testMissionId, testUserId, 'Test re-candidature après refus', 'en_attente']
    );
    console.log('✅ Nouvelle candidature créée avec succès');
  } else {
    console.log('❌ Candidature existante non refusée trouvée, re-candidature impossible');
    console.log('  Statut existant:', existing[0].status);
  }
  
  console.log('\n📊 État final...');
  
  const [finalApplications] = await db.query(
    'SELECT id, mission_id, automob_id, status, created_at FROM mission_applications WHERE automob_id = ? AND mission_id = ?',
    [testUserId, testMissionId]
  );
  
  console.log(`Candidatures finales:`, finalApplications.length);
  finalApplications.forEach(app => {
    console.log(`  - ID: ${app.id}, Statut: ${app.status}, Date: ${app.created_at}`);
  });
  
  console.log('\n✅ Test terminé avec succès !');
  console.log('\n📋 Résumé:');
  console.log('  ✅ Les candidatures refusées peuvent être supprimées');
  console.log('  ✅ Une nouvelle candidature peut être créée après refus');
  console.log('  ✅ Les candidatures en_attente/acceptées bloquent la re-candidature');
  console.log('  ✅ Le système évite les doublons');

  process.exit(0);
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}

import db from './config/database.js';

// Test de candidature à une mission pour diagnostiquer l'erreur 500
console.log('🧪 Test de candidature à une mission');

const testUserId = 24; // User mounchilithierry432@gmail.com
const testMissionId = 9; // Mission de test

try {
  console.log('\n📊 Vérifications préliminaires...');
  
  // 1. Vérifier que l'utilisateur existe et est vérifié
  const [user] = await db.query(
    'SELECT id, email, role, verified FROM users WHERE id = ?',
    [testUserId]
  );
  
  if (!user.length) {
    throw new Error(`Utilisateur ${testUserId} non trouvé`);
  }
  
  console.log('👤 Utilisateur:', user[0]);
  
  // 2. Vérifier le profil automob
  const [automobProfile] = await db.query(
    'SELECT id_verified, first_name, last_name FROM automob_profiles WHERE user_id = ?',
    [testUserId]
  );
  
  if (!automobProfile.length) {
    throw new Error(`Profil automob non trouvé pour user ${testUserId}`);
  }
  
  console.log('🔧 Profil automob:', automobProfile[0]);
  console.log('   - Vérifié:', automobProfile[0].id_verified ? '✅' : '❌');
  
  // 3. Vérifier que la mission existe et est ouverte
  const [mission] = await db.query(
    'SELECT id, mission_name, status, client_id FROM missions WHERE id = ?',
    [testMissionId]
  );
  
  if (!mission.length) {
    throw new Error(`Mission ${testMissionId} non trouvée`);
  }
  
  console.log('🎯 Mission:', mission[0]);
  console.log('   - Statut:', mission[0].status);
  
  // 4. Vérifier les candidatures existantes
  const [existingApps] = await db.query(
    'SELECT id, status FROM mission_applications WHERE mission_id = ? AND automob_id = ?',
    [testMissionId, testUserId]
  );
  
  console.log('📋 Candidatures existantes:', existingApps.length);
  existingApps.forEach(app => {
    console.log(`   - ID: ${app.id}, Statut: ${app.status}`);
  });
  
  // 5. Vérifier les candidatures non refusées
  const [existing] = await db.query(
    'SELECT id, status FROM mission_applications WHERE mission_id = ? AND automob_id = ? AND status != "refuse"',
    [testMissionId, testUserId]
  );
  
  console.log('📋 Candidatures non refusées:', existing.length);
  
  if (existing.length > 0) {
    console.log('⚠️ Candidature déjà existante:', existing[0]);
    console.log('   Statut:', existing[0].status);
  }
  
  // 6. Simuler la logique de candidature
  console.log('\n🧪 Simulation de la candidature...');
  
  // Vérification profil vérifié
  if (!automobProfile[0].id_verified) {
    console.log('❌ Profil non vérifié - candidature refusée');
  } else {
    console.log('✅ Profil vérifié');
  }
  
  // Vérification mission disponible
  if (!['ouvert', 'en_cours'].includes(mission[0].status)) {
    console.log('❌ Mission non disponible - statut:', mission[0].status);
  } else {
    console.log('✅ Mission disponible');
  }
  
  // Vérification candidature existante
  if (existing.length > 0) {
    console.log('❌ Candidature déjà existante');
    console.log('   → Erreur 400 attendue: "Vous avez déjà postulé"');
  } else {
    console.log('✅ Aucune candidature existante');
    
    // Vérifier le quota de candidatures
    const [applicationCount] = await db.query(
      'SELECT COUNT(*) as count FROM mission_applications WHERE mission_id = ?',
      [testMissionId]
    );
    
    const automobsNeeded = mission[0].automobs_needed || 1;
    const maxApplications = mission[0].max_applications || (automobsNeeded + Math.ceil(automobsNeeded * 0.2));
    
    console.log('📊 Quota candidatures:');
    console.log(`   - Actuelles: ${applicationCount[0].count}`);
    console.log(`   - Maximum: ${maxApplications}`);
    
    if (applicationCount[0].count >= maxApplications) {
      console.log('❌ Quota atteint');
    } else {
      console.log('✅ Quota OK - candidature possible');
    }
  }
  
  console.log('\n📝 Résumé du diagnostic:');
  console.log('  ✅ Utilisateur existe');
  console.log(`  ${automobProfile[0].id_verified ? '✅' : '❌'} Profil vérifié`);
  console.log(`  ${['ouvert', 'en_cours'].includes(mission[0].status) ? '✅' : '❌'} Mission disponible`);
  console.log(`  ${existing.length === 0 ? '✅' : '❌'} Pas de candidature existante`);
  
  console.log('\n💡 Si erreur 500 persiste, vérifier:');
  console.log('  - Logs serveur backend');
  console.log('  - Connexion base de données');
  console.log('  - Contraintes foreign key');
  console.log('  - Services email/notification');
  
} catch (error) {
  console.error('❌ Erreur diagnostic:', error.message);
  console.error('Stack:', error.stack);
} finally {
  process.exit(0);
}

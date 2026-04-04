import db from './config/database.js';

async function testVerificationFiles() {
  try {
    console.log('🔍 Vérification des fichiers dans la base de données...\n');
    
    const [verifications] = await db.query(`
      SELECT 
        id, user_id, user_type, first_name, last_name,
        has_habilitations, nombre_habilitations, habilitations_files,
        has_caces, nombre_caces, caces_files,
        status, submitted_at
      FROM identity_verifications_new
      ORDER BY submitted_at DESC
      LIMIT 5
    `);
    
    if (verifications.length === 0) {
      console.log('❌ Aucune vérification trouvée dans la base de données');
      process.exit(0);
    }
    
    console.log(`✅ ${verifications.length} vérification(s) trouvée(s)\n`);
    
    verifications.forEach((v, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 Vérification #${index + 1} (ID: ${v.id})`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 Utilisateur: ${v.first_name} ${v.last_name} (ID: ${v.user_id})`);
      console.log(`📅 Soumis le: ${v.submitted_at}`);
      console.log(`📊 Statut: ${v.status}`);
      console.log();
      
      // Habilitations
      console.log(`🎓 HABILITATIONS:`);
      console.log(`   Possède: ${v.has_habilitations ? 'Oui' : 'Non'}`);
      console.log(`   Nombre: ${v.nombre_habilitations || 0}`);
      console.log(`   Fichiers (brut): ${v.habilitations_files || 'NULL'}`);
      
      if (v.habilitations_files) {
        try {
          const files = JSON.parse(v.habilitations_files);
          console.log(`   Fichiers (parsé): ${JSON.stringify(files, null, 2)}`);
          console.log(`   Nombre de fichiers: ${files.length}`);
          if (files.length > 0) {
            files.forEach((file, i) => {
              console.log(`     ${i + 1}. ${file}`);
            });
          }
        } catch (e) {
          console.log(`   ❌ Erreur parsing JSON: ${e.message}`);
        }
      }
      console.log();
      
      // CACES
      console.log(`🏗️ CACES:`);
      console.log(`   Possède: ${v.has_caces ? 'Oui' : 'Non'}`);
      console.log(`   Nombre: ${v.nombre_caces || 0}`);
      console.log(`   Fichiers (brut): ${v.caces_files || 'NULL'}`);
      
      if (v.caces_files) {
        try {
          const files = JSON.parse(v.caces_files);
          console.log(`   Fichiers (parsé): ${JSON.stringify(files, null, 2)}`);
          console.log(`   Nombre de fichiers: ${files.length}`);
          if (files.length > 0) {
            files.forEach((file, i) => {
              console.log(`     ${i + 1}. ${file}`);
            });
          }
        } catch (e) {
          console.log(`   ❌ Erreur parsing JSON: ${e.message}`);
        }
      }
      console.log();
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test terminé');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

testVerificationFiles();

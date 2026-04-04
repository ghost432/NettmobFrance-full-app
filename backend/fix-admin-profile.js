import db from './config/database.js';

/**
 * Script pour vérifier et corriger les profils admin
 * - S'assure que tous les admin ont verified = 1
 * - S'assure que tous les admin ont id_verified = 1
 */

async function fixAdminProfiles() {
  try {
    console.log('🔧 Vérification et correction des profils admin...\n');
    
    // Récupérer tous les admin
    const [admins] = await db.query('SELECT id, email, verified, id_verified FROM users WHERE role = "admin"');
    
    console.log(`📊 ${admins.length} administrateur(s) trouvé(s)\n`);
    
    let updatedCount = 0;
    
    for (const admin of admins) {
      const needsUpdate = admin.verified !== 1 || admin.id_verified !== 1;
      
      console.log(`👤 Admin: ${admin.email}`);
      console.log(`   - Email vérifié: ${admin.verified === 1 ? '✅' : '❌'}`);
      console.log(`   - Identité vérifiée: ${admin.id_verified === 1 ? '✅' : '❌'}`);
      
      if (needsUpdate) {
        await db.query(
          'UPDATE users SET verified = 1, id_verified = 1, updated_at = NOW() WHERE id = ?',
          [admin.id]
        );
        console.log(`   ✅ Profil mis à jour\n`);
        updatedCount++;
      } else {
        console.log(`   ℹ️  Déjà à jour\n`);
      }
    }
    
    console.log('═'.repeat(50));
    console.log(`✅ Correction terminée: ${updatedCount} profil(s) mis à jour`);
    console.log('═'.repeat(50));
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit();
  }
}

fixAdminProfiles();

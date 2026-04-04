import db from './config/database.js';

/**
 * Script pour vérifier l'identité d'un automob (pour avoir de la diversité)
 */

async function verifyOneAutomob() {
  try {
    console.log('🔧 Vérification d\'un auto-entrepreneur pour la diversité...\n');
    
    // Vérifier l'identité du premier automob
    await db.query(
      'UPDATE users SET id_verified = 1 WHERE email = ?',
      ['ulrichthierry47@gmail.com']
    );
    
    console.log('✅ Identité vérifiée pour: ulrichthierry47@gmail.com');
    console.log('\n📊 État final:');
    console.log('  - Admin: Email ✅ | Identité ✅');
    console.log('  - Automob 1: Email ✅ | Identité ✅ (ulrichthierry47@gmail.com)');
    console.log('  - Automob 2: Email ✅ | Identité ❌ (mounchilithierry432@gmail.com)');
    console.log('\n✅ Diversité créée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit();
  }
}

verifyOneAutomob();

import db from './config/database.js';

/**
 * Script pour vérifier l'état de vérification des utilisateurs
 */

async function checkUsersVerification() {
  try {
    console.log('🔍 Vérification de l\'état des utilisateurs...\n');
    
    // Statistiques générales
    const [[stats]] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'automob' THEN 1 ELSE 0 END) as automobs,
        SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as clients,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as email_verified,
        SUM(CASE WHEN verified = 0 THEN 1 ELSE 0 END) as email_not_verified,
        SUM(CASE WHEN id_verified = 1 THEN 1 ELSE 0 END) as id_verified,
        SUM(CASE WHEN id_verified = 0 OR id_verified IS NULL THEN 1 ELSE 0 END) as id_not_verified
      FROM users
    `);
    
    console.log('📊 STATISTIQUES GÉNÉRALES');
    console.log('═'.repeat(50));
    console.log(`Total utilisateurs: ${stats.total}`);
    console.log(`  - Admins: ${stats.admins}`);
    console.log(`  - Auto-entrepreneurs: ${stats.automobs}`);
    console.log(`  - Clients: ${stats.clients}`);
    console.log();
    console.log(`Email vérifiés: ${stats.email_verified} (${Math.round(stats.email_verified / stats.total * 100)}%)`);
    console.log(`Email non vérifiés: ${stats.email_not_verified} (${Math.round(stats.email_not_verified / stats.total * 100)}%)`);
    console.log();
    console.log(`Identité vérifiée: ${stats.id_verified} (${Math.round(stats.id_verified / stats.total * 100)}%)`);
    console.log(`Identité non vérifiée: ${stats.id_not_verified} (${Math.round(stats.id_not_verified / stats.total * 100)}%)`);
    console.log('═'.repeat(50));
    console.log();
    
    // Détails par rôle
    const roles = ['admin', 'automob', 'client'];
    
    for (const role of roles) {
      const [users] = await db.query(`
        SELECT 
          id, 
          email, 
          verified, 
          id_verified,
          created_at
        FROM users 
        WHERE role = ?
        ORDER BY created_at DESC
      `, [role]);
      
      if (users.length === 0) continue;
      
      console.log(`\n📋 ${role.toUpperCase()} (${users.length})`);
      console.log('─'.repeat(50));
      
      for (const user of users) {
        const emailStatus = user.verified === 1 ? '✅' : '❌';
        const idStatus = user.id_verified === 1 ? '✅' : '❌';
        console.log(`${emailStatus} ${idStatus} ${user.email.padEnd(30)} | Créé: ${new Date(user.created_at).toLocaleDateString('fr-FR')}`);
      }
    }
    
    console.log('\n');
    console.log('Légende:');
    console.log('  Premier symbole: Email vérifié');
    console.log('  Deuxième symbole: Identité vérifiée');
    console.log('  ✅ = Vérifié | ❌ = Non vérifié');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit();
  }
}

checkUsersVerification();

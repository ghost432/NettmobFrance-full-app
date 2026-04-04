import db from './config/database.js';

async function checkWithdrawalsStructure() {
  try {
    console.log('\n=== Structure de la table withdrawal_requests ===\n');
    
    const [columns] = await db.query('SHOW COLUMNS FROM withdrawal_requests');
    
    console.log('Colonnes de la table withdrawal_requests:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Key === 'PRI' ? '[PRIMARY KEY]' : ''}`);
    });
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkWithdrawalsStructure();

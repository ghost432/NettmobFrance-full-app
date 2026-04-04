import db from './config/database.js';

async function checkWalletsStructure() {
  try {
    console.log('\n=== Structure de la table wallets ===\n');
    
    const [columns] = await db.query('SHOW COLUMNS FROM wallets');
    
    console.log('Colonnes de la table wallets:');
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

checkWalletsStructure();

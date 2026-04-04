import db from './config/database.js';

async function checkDisputesStructure() {
  try {
    console.log('\n=== Structure de la table disputes ===\n');
    
    const [columns] = await db.query('SHOW COLUMNS FROM disputes');
    
    console.log('Colonnes de la table disputes:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Key === 'PRI' ? '[PRIMARY KEY]' : ''} ${col.Null === 'YES' ? '[NULL]' : '[NOT NULL]'}`);
    });
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkDisputesStructure();

import db from './config/database.js';

async function checkMissionsStructure() {
  try {
    console.log('\n=== Structure de la table missions ===\n');
    
    const [columns] = await db.query('SHOW COLUMNS FROM missions');
    
    console.log('Colonnes de la table missions:');
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

checkMissionsStructure();

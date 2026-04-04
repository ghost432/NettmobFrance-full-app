import db from './config/database.js';

async function checkAutomobProfilesStructure() {
  try {
    console.log('\n=== Structure de la table automob_profiles ===\n');
    
    const [columns] = await db.query('SHOW COLUMNS FROM automob_profiles');
    
    console.log('Colonnes de la table automob_profiles:');
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

checkAutomobProfilesStructure();

import db from './config/database.js';

async function checkNotificationsStructure() {
  try {
    console.log('\n=== Structure de la table notifications ===\n');
    
    const [columns] = await db.query('SHOW COLUMNS FROM notifications');
    
    console.log('Colonnes de la table notifications:');
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

checkNotificationsStructure();

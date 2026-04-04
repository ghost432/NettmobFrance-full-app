import fs from 'fs';
import db from './config/database.js';

const runMigration = async () => {
  try {
    console.log('📋 Exécution de la migration identity_verifications_new...');
    
    const sql = fs.readFileSync('./migrations/create_identity_verifications_new.sql', 'utf8');
    
    await db.query(sql);
    
    console.log('✅ Migration exécutée avec succès !');
    
    // Vérifier que la table existe
    const [tables] = await db.query("SHOW TABLES LIKE 'identity_verifications_new'");
    if (tables.length > 0) {
      console.log('✅ Table identity_verifications_new créée avec succès');
      
      // Afficher la structure
      const [columns] = await db.query('DESCRIBE identity_verifications_new');
      console.log('\n📊 Structure de la table:');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
    } else {
      console.log('❌ La table n\'a pas été créée');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
};

runMigration();

import db from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🔄 Démarrage de la migration des paramètres de mission...\n');

  try {
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'database', 'migrations', 'add_mission_settings_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Séparer les commandes SQL
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('USE'));

    console.log(`📋 ${commands.length} commandes SQL à exécuter\n`);

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command) {
        try {
          await db.query(command);
          console.log(`✅ Commande ${i + 1}/${commands.length} exécutée avec succès`);
        } catch (error) {
          // Ignorer les erreurs "Table already exists"
          if (error.code === 'ER_TABLE_EXISTS_ERR') {
            console.log(`⚠️  Commande ${i + 1}/${commands.length} : Table déjà existante (ignoré)`);
          } else if (error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Commande ${i + 1}/${commands.length} : Entrée dupliquée (ignoré)`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Migration terminée avec succès !');
    
    // Vérifier les données insérées
    console.log('\n📊 Vérification des données...');
    
    const [frequencies] = await db.query('SELECT * FROM billing_frequencies');
    console.log(`   Fréquences de facturation : ${frequencies.length} entrées`);
    
    const [locations] = await db.query('SELECT * FROM location_types');
    console.log(`   Types de lieux : ${locations.length} entrées`);
    
    const [rates] = await db.query('SELECT * FROM hourly_rates');
    console.log(`   Tarifs horaires : ${rates.length} entrées`);

    console.log('\n🎉 Tout est prêt !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runMigration();

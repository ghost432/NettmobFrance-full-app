// Script Node.js pour exécuter la migration en toute sécurité
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  console.log('🚀 Démarrage de la migration...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'automob_app'
  });

  try {
    // Vérifier et ajouter les colonnes une par une
    const columns = [
      { name: 'gender', sql: "ADD COLUMN gender ENUM('homme', 'femme', '') DEFAULT '' AFTER last_name" },
      { name: 'iban', sql: 'ADD COLUMN iban VARCHAR(34) AFTER phone_country_code' },
      { name: 'bic_swift', sql: 'ADD COLUMN bic_swift VARCHAR(11) AFTER iban' },
      { name: 'years_of_experience', sql: "ADD COLUMN years_of_experience ENUM('junior', 'intermediaire', 'senior', 'expert', '') DEFAULT '' AFTER experience" },
      { name: 'about_me', sql: 'ADD COLUMN about_me TEXT AFTER secteur_id' },
      { name: 'work_areas', sql: 'ADD COLUMN work_areas JSON AFTER city' }
    ];

    for (const column of columns) {
      try {
        // Vérifier si la colonne existe
        const [rows] = await connection.query(
          `SHOW COLUMNS FROM automob_profiles LIKE ?`,
          [column.name]
        );

        if (rows.length === 0) {
          console.log(`✅ Ajout de la colonne "${column.name}"...`);
          await connection.query(`ALTER TABLE automob_profiles ${column.sql}`);
          console.log(`   ✓ Colonne "${column.name}" ajoutée avec succès`);
        } else {
          console.log(`⏭️  Colonne "${column.name}" existe déjà, ignoré`);
        }
      } catch (error) {
        console.error(`❌ Erreur pour la colonne "${column.name}":`, error.message);
      }
    }

    // Créer la table des disponibilités
    console.log('\n✅ Création de la table automob_availabilities...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS automob_availabilities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_dates (user_id, start_date, end_date)
      )
    `);
    console.log('   ✓ Table automob_availabilities créée/vérifiée');

    // Afficher la structure finale
    console.log('\n📋 Structure finale de la table automob_profiles:');
    const [structure] = await connection.query('DESCRIBE automob_profiles');
    console.table(structure.map(col => ({ 
      Field: col.Field, 
      Type: col.Type, 
      Null: col.Null,
      Default: col.Default 
    })));

    console.log('\n✅ Migration terminée avec succès! 🎉');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Exécuter la migration
runMigration()
  .then(() => {
    console.log('\n✅ Tout est prêt! Vous pouvez maintenant utiliser les nouveaux champs.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ La migration a échoué:', error.message);
    process.exit(1);
  });

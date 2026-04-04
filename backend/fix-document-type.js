import db from './config/database.js';

const fixDocumentType = async () => {
  try {
    console.log('🔧 Ajout du type de document "titre_sejour"...');
    
    await db.query(`
      ALTER TABLE identity_verifications_new 
      MODIFY document_type ENUM('carte_identite', 'passeport', 'permis_conduire', 'titre_sejour') NOT NULL
    `);
    
    console.log('✅ Type de document mis à jour avec succès !');
    
    // Vérifier
    const [columns] = await db.query("SHOW COLUMNS FROM identity_verifications_new LIKE 'document_type'");
    console.log('\n📊 Nouvelle définition:', columns[0].Type);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

fixDocumentType();

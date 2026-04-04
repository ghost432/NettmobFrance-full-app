import db from './config/database.js';

async function checkWalletTransactionsStructure() {
  try {
    console.log('\n=== Structure de la table wallet_transactions ===\n');
    
    const [columns] = await db.query('DESCRIBE wallet_transactions');
    
    console.table(columns);
    
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkWalletTransactionsStructure();

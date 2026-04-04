import db from './config/database.js';

async function checkWalletStructure() {
  try {
    console.log('\n=== Structure de la table wallets ===\n');
    const [walletColumns] = await db.query('DESCRIBE wallets');
    console.table(walletColumns);
    
    console.log('\n=== Structure de la table wallet_transactions ===\n');
    const [transactionColumns] = await db.query('DESCRIBE wallet_transactions');
    console.table(transactionColumns);
    
    console.log('\n=== Vérification relations ===\n');
    
    // Vérifier les clés étrangères
    const [fkInfo] = await db.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('wallets', 'wallet_transactions')
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('Clés étrangères:');
    console.table(fkInfo);
    
    console.log('\n=== Exemple de données wallets ===\n');
    const [wallets] = await db.query('SELECT * FROM wallets LIMIT 3');
    console.table(wallets);
    
    console.log('\n=== Exemple de données wallet_transactions ===\n');
    const [transactions] = await db.query('SELECT * FROM wallet_transactions LIMIT 3');
    console.table(transactions);
    
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkWalletStructure();

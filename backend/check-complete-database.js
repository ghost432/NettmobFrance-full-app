import db from './config/database.js';

async function checkCompleteDatabase() {
  try {
    console.log('\n========================================');
    console.log('  VÉRIFICATION COMPLÈTE BASE DE DONNÉES');
    console.log('========================================\n');
    
    // 1. Vérifier les tables principales
    console.log('📋 TABLES PRINCIPALES:\n');
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    const criticalTables = [
      'users',
      'automob_profiles',
      'client_profiles',
      'missions',
      'wallets',
      'wallet_transactions',
      'disputes',
      'notifications',
      'fcm_tokens',
      'invoices',
      'withdrawal_requests'
    ];
    
    criticalTables.forEach(table => {
      const exists = tableNames.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    });
    
    // 2. Vérifier structure wallet_transactions
    console.log('\n\n📊 STRUCTURE wallet_transactions:\n');
    const [wtColumns] = await db.query('DESCRIBE wallet_transactions');
    console.table(wtColumns.map(c => ({
      Field: c.Field,
      Type: c.Type.substring(0, 30),
      Null: c.Null,
      Key: c.Key,
      Default: c.Default || 'NULL'
    })));
    
    // 3. Vérifier ENUM type
    const typeColumn = wtColumns.find(c => c.Field === 'type');
    console.log('\n🔍 ENUM type valeurs autorisées:');
    console.log(typeColumn.Type);
    
    // 4. Vérifier contraintes NOT NULL
    console.log('\n\n⚠️  Colonnes NOT NULL dans wallet_transactions:');
    const notNullCols = wtColumns.filter(c => c.Null === 'NO');
    notNullCols.forEach(c => {
      console.log(`  - ${c.Field} (${c.Type.substring(0, 20)})`);
    });
    
    // 5. Vérifier Foreign Keys
    console.log('\n\n🔗 FOREIGN KEYS:\n');
    const [fks] = await db.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wallet_transactions'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (fks.length > 0) {
      fks.forEach(fk => {
        console.log(`✅ ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('⚠️  Aucune Foreign Key trouvée');
    }
    
    // 6. Vérifier données wallets
    console.log('\n\n💰 WALLETS - Statistiques:\n');
    const [walletStats] = await db.query(`
      SELECT 
        COUNT(*) as total_wallets,
        SUM(balance) as total_balance,
        AVG(balance) as avg_balance,
        MAX(balance) as max_balance,
        MIN(balance) as min_balance
      FROM wallets
    `);
    console.table(walletStats);
    
    // 7. Vérifier transactions récentes
    console.log('\n📝 WALLET_TRANSACTIONS - Dernières 5:\n');
    const [recentTx] = await db.query(`
      SELECT 
        id,
        wallet_id,
        automob_id,
        type,
        amount,
        balance_before,
        balance_after,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as date
      FROM wallet_transactions
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (recentTx.length > 0) {
      console.table(recentTx);
      
      // Vérifier cohérence
      console.log('\n🔍 Vérification cohérence:');
      recentTx.forEach(tx => {
        const calculated = parseFloat(tx.balance_after) - parseFloat(tx.balance_before);
        const expected = parseFloat(tx.amount);
        const coherent = Math.abs(calculated - expected) < 0.01;
        console.log(`  ID ${tx.id}: ${coherent ? '✅' : '❌'} (${calculated.toFixed(2)} = ${expected.toFixed(2)})`);
      });
    } else {
      console.log('ℹ️  Aucune transaction trouvée');
    }
    
    // 8. Vérifier disputes
    console.log('\n\n⚖️  DISPUTES - Statistiques:\n');
    const [disputeStats] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM disputes
      GROUP BY status
    `);
    
    if (disputeStats.length > 0) {
      console.table(disputeStats);
    } else {
      console.log('ℹ️  Aucun litige trouvé');
    }
    
    // 9. Vérifier notifications
    console.log('\n\n🔔 NOTIFICATIONS - Statistiques:\n');
    const [notifStats] = await db.query(`
      SELECT 
        category,
        is_read,
        COUNT(*) as count
      FROM notifications
      GROUP BY category, is_read
      ORDER BY category, is_read
    `);
    
    if (notifStats.length > 0) {
      console.table(notifStats);
    } else {
      console.log('ℹ️  Aucune notification trouvée');
    }
    
    // 10. Vérifier FCM tokens
    console.log('\n\n📱 FCM_TOKENS:\n');
    const [fcmStats] = await db.query(`
      SELECT 
        COUNT(*) as total_tokens,
        COUNT(DISTINCT user_id) as unique_users
      FROM fcm_tokens
    `);
    console.table(fcmStats);
    
    // 11. Vérifier users
    console.log('\n\n👥 USERS - Par rôle:\n');
    const [userStats] = await db.query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    console.table(userStats);
    
    // 12. Vérifier missions
    console.log('\n\n📋 MISSIONS - Par statut:\n');
    const [missionStats] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM missions
      GROUP BY status
    `);
    
    if (missionStats.length > 0) {
      console.table(missionStats);
    } else {
      console.log('ℹ️  Aucune mission trouvée');
    }
    
    // 13. Tests d'intégrité
    console.log('\n\n🔍 TESTS D\'INTÉGRITÉ:\n');
    
    // Test 1: Wallets sans automob
    const [orphanWallets] = await db.query(`
      SELECT COUNT(*) as count 
      FROM wallets w
      LEFT JOIN users u ON w.automob_id = u.id
      WHERE u.id IS NULL
    `);
    console.log(`${orphanWallets[0].count === 0 ? '✅' : '❌'} Wallets orphelins: ${orphanWallets[0].count}`);
    
    // Test 2: Transactions sans wallet
    const [orphanTx] = await db.query(`
      SELECT COUNT(*) as count 
      FROM wallet_transactions wt
      LEFT JOIN wallets w ON wt.wallet_id = w.id
      WHERE w.id IS NULL
    `);
    console.log(`${orphanTx[0].count === 0 ? '✅' : '❌'} Transactions orphelines: ${orphanTx[0].count}`);
    
    // Test 3: Disputes sans mission
    const [orphanDisputes] = await db.query(`
      SELECT COUNT(*) as count 
      FROM disputes d
      LEFT JOIN missions m ON d.mission_id = m.id
      WHERE m.id IS NULL
    `);
    console.log(`${orphanDisputes[0].count === 0 ? '✅' : '❌'} Litiges orphelins: ${orphanDisputes[0].count}`);
    
    console.log('\n========================================');
    console.log('  ✅ VÉRIFICATION TERMINÉE');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkCompleteDatabase();

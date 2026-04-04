import db from './config/database.js';

async function fixTransactionId5() {
  try {
    console.log('\n========================================');
    console.log('  CORRECTION TRANSACTION ID 5');
    console.log('========================================\n');
    
    // 1. Vérifier la transaction avant correction
    console.log('📋 AVANT CORRECTION:\n');
    const [before] = await db.query(`
      SELECT 
        id,
        type,
        amount,
        balance_before,
        balance_after,
        (balance_after - balance_before) as calculated,
        description,
        created_at
      FROM wallet_transactions 
      WHERE id = 5
    `);
    
    if (before.length === 0) {
      console.log('❌ Transaction ID 5 non trouvée');
      process.exit(1);
    }
    
    console.table(before.map(t => ({
      id: t.id,
      type: t.type,
      amount: parseFloat(t.amount).toFixed(2),
      balance_before: parseFloat(t.balance_before).toFixed(2),
      balance_after: parseFloat(t.balance_after).toFixed(2),
      calculated: parseFloat(t.calculated).toFixed(2),
      coherent: Math.abs(t.amount - t.calculated) < 0.01 ? '✅' : '❌'
    })));
    
    const transaction = before[0];
    const calculated = parseFloat(transaction.calculated);
    
    console.log('\n🔍 Analyse:');
    console.log(`  Type: ${transaction.type}`);
    console.log(`  Amount stocké: ${parseFloat(transaction.amount).toFixed(2)}`);
    console.log(`  Amount calculé: ${calculated.toFixed(2)}`);
    console.log(`  Différence: ${(parseFloat(transaction.amount) - calculated).toFixed(2)}`);
    
    if (Math.abs(parseFloat(transaction.amount) - calculated) < 0.01) {
      console.log('\n✅ Transaction déjà cohérente, aucune correction nécessaire');
      process.exit(0);
    }
    
    // 2. Correction
    console.log('\n🔧 CORRECTION EN COURS...\n');
    
    await db.query(`
      UPDATE wallet_transactions 
      SET amount = ? 
      WHERE id = 5
    `, [calculated]);
    
    console.log('✅ Transaction mise à jour\n');
    
    // 3. Vérifier après correction
    console.log('📋 APRÈS CORRECTION:\n');
    const [after] = await db.query(`
      SELECT 
        id,
        type,
        amount,
        balance_before,
        balance_after,
        (balance_after - balance_before) as calculated,
        description
      FROM wallet_transactions 
      WHERE id = 5
    `);
    
    console.table(after.map(t => ({
      id: t.id,
      type: t.type,
      amount: parseFloat(t.amount).toFixed(2),
      balance_before: parseFloat(t.balance_before).toFixed(2),
      balance_after: parseFloat(t.balance_after).toFixed(2),
      calculated: parseFloat(t.calculated).toFixed(2),
      coherent: Math.abs(t.amount - t.calculated) < 0.01 ? '✅' : '❌'
    })));
    
    const afterTx = after[0];
    const isCoherent = Math.abs(parseFloat(afterTx.amount) - parseFloat(afterTx.calculated)) < 0.01;
    
    console.log('\n========================================');
    if (isCoherent) {
      console.log('  ✅ CORRECTION RÉUSSIE');
      console.log('  Transaction ID 5 maintenant cohérente');
    } else {
      console.log('  ❌ ERREUR: Transaction toujours incohérente');
    }
    console.log('========================================\n');
    
    process.exit(isCoherent ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixTransactionId5();

import db from '../config/database.js';

/**
 * Obtenir ou créer le wallet d'un automob
 */
export async function getOrCreateWallet(automobId) {
  try {
    // Vérifier si le wallet existe
    const [wallets] = await db.query(
      'SELECT * FROM wallets WHERE automob_id = ?',
      [automobId]
    );

    if (wallets.length > 0) {
      return wallets[0];
    }

    // Créer un nouveau wallet
    const [result] = await db.query(
      'INSERT INTO wallets (automob_id, balance, total_earned, total_withdrawn) VALUES (?, 0.00, 0.00, 0.00)',
      [automobId]
    );

    const [newWallet] = await db.query(
      'SELECT * FROM wallets WHERE id = ?',
      [result.insertId]
    );

    return newWallet[0];
  } catch (error) {
    console.error('Get or create wallet error:', error);
    throw error;
  }
}

/**
 * Créditer le wallet (ajouter de l'argent)
 */
export async function creditWallet(automobId, amount, description, referenceType = null, referenceId = null, createdBy = null) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtenir ou créer le wallet
    let [wallets] = await connection.query(
      'SELECT * FROM wallets WHERE automob_id = ? FOR UPDATE',
      [automobId]
    );

    // Si le wallet n'existe pas, le créer
    if (wallets.length === 0) {
      console.log(`📝 Création du wallet pour automob ${automobId}`);
      await connection.query(
        'INSERT INTO wallets (automob_id, balance, total_earned, total_withdrawn, created_at) VALUES (?, 0, 0, 0, NOW())',
        [automobId]
      );
      
      // Récupérer le wallet créé
      [wallets] = await connection.query(
        'SELECT * FROM wallets WHERE automob_id = ? FOR UPDATE',
        [automobId]
      );
    }

    const wallet = wallets[0];
    const balanceBefore = parseFloat(wallet.balance);
    const balanceAfter = balanceBefore + parseFloat(amount);

    // Mettre à jour le wallet
    await connection.query(
      'UPDATE wallets SET balance = ?, total_earned = total_earned + ? WHERE id = ?',
      [balanceAfter, amount, wallet.id]
    );

    // Enregistrer la transaction
    await connection.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, automob_id, type, amount, balance_before, balance_after, description, reference_type, reference_id, created_by) 
       VALUES (?, ?, 'credit', ?, ?, ?, ?, ?, ?, ?)`,
      [wallet.id, automobId, amount, balanceBefore, balanceAfter, description, referenceType, referenceId, createdBy]
    );

    await connection.commit();
    return { success: true, newBalance: balanceAfter };
  } catch (error) {
    await connection.rollback();
    console.error('Credit wallet error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Débiter le wallet (retirer de l'argent)
 */
export async function debitWallet(automobId, amount, description, referenceType = null, referenceId = null, createdBy = null) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtenir le wallet
    const [wallets] = await connection.query(
      'SELECT * FROM wallets WHERE automob_id = ? FOR UPDATE',
      [automobId]
    );

    if (wallets.length === 0) {
      throw new Error('Wallet non trouvé');
    }

    const wallet = wallets[0];
    const balanceBefore = parseFloat(wallet.balance);
    const balanceAfter = balanceBefore - parseFloat(amount);

    if (balanceAfter < 0) {
      throw new Error('Solde insuffisant');
    }

    // Mettre à jour le wallet
    await connection.query(
      'UPDATE wallets SET balance = ?, total_withdrawn = total_withdrawn + ? WHERE id = ?',
      [balanceAfter, amount, wallet.id]
    );

    // Enregistrer la transaction
    await connection.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, automob_id, type, amount, balance_before, balance_after, description, reference_type, reference_id, created_by) 
       VALUES (?, ?, 'debit', ?, ?, ?, ?, ?, ?, ?)`,
      [wallet.id, automobId, amount, balanceBefore, balanceAfter, description, referenceType, referenceId, createdBy]
    );

    await connection.commit();
    return { success: true, newBalance: balanceAfter };
  } catch (error) {
    await connection.rollback();
    console.error('Debit wallet error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Ajustement manuel du wallet par l'admin
 */
export async function adjustWalletBalance(automobId, newBalance, adminId, reason) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtenir le wallet
    const [wallets] = await connection.query(
      'SELECT * FROM wallets WHERE automob_id = ? FOR UPDATE',
      [automobId]
    );

    if (wallets.length === 0) {
      throw new Error('Wallet non trouvé');
    }

    const wallet = wallets[0];
    const balanceBefore = parseFloat(wallet.balance);
    const difference = parseFloat(newBalance) - balanceBefore;

    // Mettre à jour le wallet
    await connection.query(
      'UPDATE wallets SET balance = ? WHERE id = ?',
      [newBalance, wallet.id]
    );

    // Enregistrer la transaction d'ajustement
    await connection.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, automob_id, type, amount, balance_before, balance_after, description, reference_type, created_by) 
       VALUES (?, ?, 'adjustment', ?, ?, ?, ?, 'manual_adjustment', ?)`,
      [wallet.id, automobId, Math.abs(difference), balanceBefore, newBalance, reason, adminId]
    );

    await connection.commit();
    return { success: true, oldBalance: balanceBefore, newBalance: parseFloat(newBalance) };
  } catch (error) {
    await connection.rollback();
    console.error('Adjust wallet error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Créer une demande de retrait
 */
export async function createWithdrawalRequest(automobId, amount, paymentMethod, bankDetails, notes) {
  try {
    // Vérifier le solde
    const wallet = await getOrCreateWallet(automobId);
    
    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      throw new Error('Solde insuffisant pour cette demande de retrait');
    }

    // Créer la demande
    const [result] = await db.query(
      `INSERT INTO withdrawal_requests 
       (automob_id, amount, payment_method, bank_details, notes, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [automobId, amount, paymentMethod, bankDetails, notes]
    );

    return result.insertId;
  } catch (error) {
    console.error('Create withdrawal request error:', error);
    throw error;
  }
}

/**
 * Approuver une demande de retrait
 */
export async function approveWithdrawal(withdrawalId, adminId, adminNotes = null) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtenir la demande
    const [requests] = await connection.query(
      'SELECT * FROM withdrawal_requests WHERE id = ? FOR UPDATE',
      [withdrawalId]
    );

    if (requests.length === 0) {
      throw new Error('Demande de retrait non trouvée');
    }

    const request = requests[0];

    if (request.status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée');
    }

    // Débiter le wallet
    await debitWallet(
      request.automob_id,
      request.amount,
      `Retrait approuvé - Demande #${withdrawalId}`,
      'withdrawal',
      withdrawalId,
      adminId
    );

    // Mettre à jour la demande
    await connection.query(
      `UPDATE withdrawal_requests 
       SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), admin_notes = ? 
       WHERE id = ?`,
      [adminId, adminNotes, withdrawalId]
    );

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error('Approve withdrawal error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Refuser une demande de retrait
 */
export async function rejectWithdrawal(withdrawalId, adminId, adminNotes) {
  try {
    // Vérifier que la demande existe et est en attente
    const [requests] = await db.query(
      'SELECT * FROM withdrawal_requests WHERE id = ?',
      [withdrawalId]
    );

    if (requests.length === 0) {
      throw new Error('Demande de retrait non trouvée');
    }

    if (requests[0].status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée');
    }

    // Mettre à jour la demande
    await db.query(
      `UPDATE withdrawal_requests 
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), admin_notes = ? 
       WHERE id = ?`,
      [adminId, adminNotes, withdrawalId]
    );

    return { success: true };
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    throw error;
  }
}

export default {
  getOrCreateWallet,
  creditWallet,
  debitWallet,
  adjustWalletBalance,
  createWithdrawalRequest,
  approveWithdrawal,
  rejectWithdrawal
};

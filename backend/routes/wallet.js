import express from 'express';
import db from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  getOrCreateWallet,
  createWithdrawalRequest,
  approveWithdrawal,
  rejectWithdrawal,
  adjustWalletBalance
} from '../services/walletService.js';
import { createNotification } from '../utils/notificationHelper.js';
import { sendNotificationEmail } from '../services/emailService.js';

const router = express.Router();

// ============ AUTOMOB ROUTES ============

// Get automob wallet
router.get('/my-wallet', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    res.json(wallet);
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get wallet transactions
router.get('/my-transactions', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const [transactions] = await db.query(
      `SELECT * FROM wallet_transactions 
       WHERE automob_id = ? 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [req.user.id]
    );

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get automob withdrawal requests
router.get('/my-withdrawals', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT wr.*, u.email as reviewed_by_email
       FROM withdrawal_requests wr
       LEFT JOIN users u ON wr.reviewed_by = u.id
       WHERE wr.automob_id = ? 
       ORDER BY wr.requested_at DESC`,
      [req.user.id]
    );

    res.json(requests);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create withdrawal request
router.post('/request-withdrawal', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const { amount, accountHolderName, iban, bic, paymentMethod = 'bank_transfer', notes = null } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    if (!accountHolderName || !iban || !bic) {
      return res.status(400).json({ error: 'Informations bancaires incomplètes (nom, IBAN, BIC requis)' });
    }

    // Formater les informations bancaires en JSON
    const bankDetails = JSON.stringify({
      accountHolderName,
      iban,
      bic
    });

    const withdrawalId = await createWithdrawalRequest(
      req.user.id,
      amount,
      paymentMethod,
      bankDetails,
      notes
    );

    // Récupérer infos Automob
    const [automobInfo] = await db.query(
      'SELECT first_name, last_name FROM automob_profiles WHERE user_id = ?',
      [req.user.id]
    );
    const [automobEmail] = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    const automobName = (automobInfo[0]?.first_name && automobInfo[0]?.last_name)
      ? `${automobInfo[0].first_name} ${automobInfo[0].last_name}`
      : automobEmail[0]?.email || 'Automob';

    // Notification pour l'Automob (confirmation)
    await createNotification(
      req.user.id,
      '💰 Demande de retrait envoyée',
      `Votre demande de retrait de ${parseFloat(amount).toFixed(2)}€ a été envoyée. Elle sera traitée sous 48h.`,
      'info',
      'payment',
      '/automob/wallet'
    );

    // Email confirmation automob
    if (automobEmail.length > 0) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3A559F;">💰 Demande de retrait reçue</h2>
          
          <p>Bonjour ${automobName},</p>
          
          <p>Nous avons bien reçu votre demande de retrait.</p>
          
          <div style="background-color: #F5F7FB; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3A559F;">
            <p style="margin: 5px 0;"><strong>Montant demandé:</strong> ${parseFloat(amount).toFixed(2)}€</p>
            <p style="margin: 5px 0;"><strong>Méthode:</strong> ${paymentMethod}</p>
            ${notes ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${notes}</p>` : ''}
          </div>
          
          <p>Votre demande sera traitée dans un délai de 48 heures ouvrées.</p>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/automob/wallet" 
               style="background-color: #3A559F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir mon wallet
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Cet email a été envoyé automatiquement par NettmobFrance.
          </p>
        </div>
      `;

      await sendNotificationEmail(
        automobEmail[0].email,
        '💰 Demande de retrait reçue',
        html
      );
    }

    // Notifications pour tous les admins
    const [admins] = await db.query('SELECT id, email FROM users WHERE role = "admin"');

    for (const admin of admins) {
      await createNotification(
        admin.id,
        '💰 Nouvelle demande de retrait',
        `${automobName} a demandé un retrait de ${parseFloat(amount).toFixed(2)}€`,
        'warning',
        'payment',
        '/admin/wallet-management'
      );

      // Email admin
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">💰 Nouvelle demande de retrait</h2>
          
          <p>Bonjour Admin,</p>
          
          <p>Un Automob a effectué une demande de retrait.</p>
          
          <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0;"><strong>Automob:</strong> ${automobName}</p>
            <p style="margin: 5px 0;"><strong>Montant:</strong> ${parseFloat(amount).toFixed(2)}€</p>
            <p style="margin: 5px 0;"><strong>Méthode:</strong> ${paymentMethod}</p>
            ${notes ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${notes}</p>` : ''}
          </div>
          
          <p>Veuillez traiter cette demande dans les plus brefs délais.</p>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/admin/wallet-management" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Gérer les retraits
            </a>
          </div>
        </div>
      `;

      await sendNotificationEmail(admin.email, '💰 Nouvelle demande de retrait', html);
    }

    res.status(201).json({
      message: 'Demande de retrait créée',
      withdrawalId
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// ============ ADMIN ROUTES ============

// Get all withdrawal requests
router.get('/admin/withdrawals', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT wr.*, 
             ap.first_name, ap.last_name, ap.phone,
             u.email as automob_email,
             w.balance as current_balance,
             admin_user.email as reviewed_by_email
      FROM withdrawal_requests wr
      JOIN users u ON wr.automob_id = u.id
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN wallets w ON wr.automob_id = w.automob_id
      LEFT JOIN users admin_user ON wr.reviewed_by = admin_user.id
    `;

    const params = [];

    if (status) {
      query += ' WHERE wr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY wr.requested_at DESC';

    const [requests] = await db.query(query, params);
    res.json(requests);
  } catch (error) {
    console.error('Get admin withdrawals error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all wallets
router.get('/admin/all-wallets', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [wallets] = await db.query(`
      SELECT w.*, 
             ap.first_name, ap.last_name,
             u.email as automob_email
      FROM wallets w
      JOIN users u ON w.automob_id = u.id
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      ORDER BY w.balance DESC
    `);

    res.json(wallets);
  } catch (error) {
    console.error('Get all wallets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get wallet by automob ID
router.get('/admin/wallet/:automobId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [wallets] = await db.query(`
      SELECT w.*, 
             ap.first_name, ap.last_name,
             u.email as automob_email
      FROM wallets w
      JOIN users u ON w.automob_id = u.id
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE w.automob_id = ?
    `, [req.params.automobId]);

    if (wallets.length === 0) {
      return res.status(404).json({ error: 'Wallet non trouvé' });
    }

    // Get transactions
    const [transactions] = await db.query(
      `SELECT * FROM wallet_transactions 
       WHERE automob_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.params.automobId]
    );

    res.json({
      wallet: wallets[0],
      transactions
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Adjust wallet balance
router.post('/admin/adjust-balance', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { automobId, newBalance, reason } = req.body;

    if (!automobId || newBalance === undefined || !reason) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    if (parseFloat(newBalance) < 0) {
      return res.status(400).json({ error: 'Le solde ne peut pas être négatif' });
    }

    const result = await adjustWalletBalance(automobId, newBalance, req.user.id, reason);

    // Notifier l'Automob
    await createNotification(
      automobId,
      '💰 Ajustement de wallet',
      `Votre solde a été ajusté de ${result.oldBalance.toFixed(2)}€ à ${result.newBalance.toFixed(2)}€. Raison: ${reason}`,
      'wallet_adjustment'
    );

    res.json({
      message: 'Solde ajusté avec succès',
      ...result
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Add funds to wallet
router.post('/admin/add-funds', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { automobId, amount, reason } = req.body;

    if (!automobId || !amount || !reason) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Le montant doit être positif' });
    }

    // Récupérer le wallet actuel
    const wallet = await getOrCreateWallet(automobId);
    const oldBalance = parseFloat(wallet.balance);
    const newBalance = oldBalance + parseFloat(amount);

    // Mettre à jour le wallet
    await db.query(
      'UPDATE wallets SET balance = ?, updated_at = NOW() WHERE automob_id = ?',
      [newBalance, automobId]
    );

    // Créer une transaction
    await db.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, automob_id, type, amount, balance_before, balance_after, description, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [wallet.id, automobId, 'adjustment', amount, oldBalance, newBalance, reason, req.user.id]
    );

    // Notifier l'Automob
    await createNotification(
      automobId,
      '💰 Fonds ajoutés',
      `${parseFloat(amount).toFixed(2)}€ ont été ajoutés à votre wallet. Raison: ${reason}`,
      'success',
      'payment',
      '/automob/wallet',
      req.app.get('io')
    );

    res.json({
      message: 'Fonds ajoutés avec succès',
      oldBalance: oldBalance.toFixed(2),
      amount: parseFloat(amount).toFixed(2),
      newBalance: newBalance.toFixed(2)
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Subtract funds from wallet
router.post('/admin/subtract-funds', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { automobId, amount, reason } = req.body;

    if (!automobId || !amount || !reason) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Le montant doit être positif' });
    }

    // Récupérer le wallet actuel
    const wallet = await getOrCreateWallet(automobId);
    const oldBalance = parseFloat(wallet.balance);
    const newBalance = Math.max(0, oldBalance - parseFloat(amount));

    // Mettre à jour le wallet
    await db.query(
      'UPDATE wallets SET balance = ?, updated_at = NOW() WHERE automob_id = ?',
      [newBalance, automobId]
    );

    // Créer une transaction
    await db.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, automob_id, type, amount, balance_before, balance_after, description, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [wallet.id, automobId, 'adjustment', -amount, oldBalance, newBalance, reason, req.user.id]
    );

    // Notifier l'Automob
    await createNotification(
      automobId,
      '⚠️ Fonds soustraits',
      `${parseFloat(amount).toFixed(2)}€ ont été soustraits de votre wallet. Raison: ${reason}`,
      'warning',
      'payment',
      '/automob/wallet',
      req.app.get('io')
    );

    res.json({
      message: 'Fonds soustraits avec succès',
      oldBalance: oldBalance.toFixed(2),
      amount: parseFloat(amount).toFixed(2),
      newBalance: newBalance.toFixed(2)
    });
  } catch (error) {
    console.error('Subtract funds error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Reset wallet to zero
router.post('/admin/reset-wallet', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { automobId, reason } = req.body;

    if (!automobId || !reason) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Récupérer le wallet actuel
    const wallet = await getOrCreateWallet(automobId);
    const oldBalance = parseFloat(wallet.balance);

    // Mettre à jour le wallet à zéro
    await db.query(
      'UPDATE wallets SET balance = 0.00, updated_at = NOW() WHERE automob_id = ?',
      [automobId]
    );

    // Créer une transaction
    await db.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, automob_id, type, amount, balance_before, balance_after, description, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [wallet.id, automobId, 'adjustment', -oldBalance, oldBalance, 0, reason, req.user.id]
    );

    // Notifier l'automob
    await createNotification(
      automobId,
      '🔄 Wallet remis à zéro',
      `Votre wallet a été remis à zéro (ancien solde: ${oldBalance.toFixed(2)}€). Raison: ${reason}`,
      'warning',
      'payment',
      '/automob/wallet',
      null
    );

    res.json({
      message: 'Wallet remis à zéro avec succès',
      oldBalance: oldBalance.toFixed(2),
      newBalance: '0.00'
    });
  } catch (error) {
    console.error('Reset wallet error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Approve withdrawal
router.post('/admin/approve-withdrawal/:withdrawalId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;

    await approveWithdrawal(req.params.withdrawalId, req.user.id, adminNotes);

    // Obtenir les détails de la demande pour notifier l'automob
    const [requests] = await db.query(
      'SELECT * FROM withdrawal_requests WHERE id = ?',
      [req.params.withdrawalId]
    );

    if (requests.length > 0) {
      const request = requests[0];

      // Récupérer infos automob
      const [automobInfo] = await db.query(
        'SELECT first_name, last_name FROM automob_profiles WHERE user_id = ?',
        [request.automob_id]
      );
      const [automobEmail] = await db.query('SELECT email FROM users WHERE id = ?', [request.automob_id]);
      const automobName = (automobInfo[0]?.first_name && automobInfo[0]?.last_name)
        ? `${automobInfo[0].first_name} ${automobInfo[0].last_name}`
        : automobEmail[0]?.email || 'Automob';

      // Notifier l'automob
      await createNotification(
        request.automob_id,
        '✅ Retrait approuvé',
        `Votre demande de retrait de ${parseFloat(request.amount).toFixed(2)}€ a été approuvée. Le virement sera effectué sous 3-5 jours ouvrés.`,
        'success',
        'payment',
        '/automob/wallet'
      );

      // Email automob
      if (automobEmail.length > 0) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">✅ Retrait approuvé !</h2>
            
            <p>Bonjour ${automobName},</p>
            
            <p>Excellente nouvelle ! Votre demande de retrait a été approuvée.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <p style="margin: 5px 0;"><strong>Montant:</strong> ${parseFloat(request.amount).toFixed(2)}€</p>
              <p style="margin: 5px 0;"><strong>Méthode:</strong> ${request.payment_method}</p>
              ${adminNotes ? `<p style="margin: 5px 0;"><strong>Note admin:</strong> ${adminNotes}</p>` : ''}
            </div>
            
            <p>Le virement sera effectué sous 3 à 5 jours ouvrés sur votre compte bancaire.</p>
            
            <div style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/automob/wallet" 
                 style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir mon wallet
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Cet email a été envoyé automatiquement par NettmobFrance.
            </p>
          </div>
        `;

        await sendNotificationEmail(
          automobEmail[0].email,
          '✅ Retrait approuvé',
          html
        );
      }
    }

    res.json({ message: 'Retrait approuvé avec succès' });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Reject withdrawal
router.post('/admin/reject-withdrawal/:withdrawalId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;

    if (!adminNotes) {
      return res.status(400).json({ error: 'Raison du refus requise' });
    }

    await rejectWithdrawal(req.params.withdrawalId, req.user.id, adminNotes);

    // Obtenir les détails de la demande pour notifier l'automob
    const [requests] = await db.query(
      'SELECT * FROM withdrawal_requests WHERE id = ?',
      [req.params.withdrawalId]
    );

    if (requests.length > 0) {
      const request = requests[0];

      // Récupérer infos automob
      const [automobInfo] = await db.query(
        'SELECT first_name, last_name FROM automob_profiles WHERE user_id = ?',
        [request.automob_id]
      );
      const [automobEmail] = await db.query('SELECT email FROM users WHERE id = ?', [request.automob_id]);
      const automobName = (automobInfo[0]?.first_name && automobInfo[0]?.last_name)
        ? `${automobInfo[0].first_name} ${automobInfo[0].last_name}`
        : automobEmail[0]?.email || 'Automob';

      // Notifier l'automob
      await createNotification(
        request.automob_id,
        '❌ Retrait refusé',
        `Votre demande de retrait de ${parseFloat(request.amount).toFixed(2)}€ a été refusée. Raison: ${adminNotes}`,
        'error',
        'payment',
        '/automob/wallet'
      );

      // Email automob
      if (automobEmail.length > 0) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">❌ Retrait refusé</h2>
            
            <p>Bonjour ${automobName},</p>
            
            <p>Nous sommes désolés, mais votre demande de retrait a été refusée.</p>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 5px 0;"><strong>Montant demandé:</strong> ${parseFloat(request.amount).toFixed(2)}€</p>
              <p style="margin: 5px 0;"><strong>Raison du refus:</strong></p>
              <p style="margin: 10px 0; padding: 10px; background: white; border-radius: 4px;">${adminNotes}</p>
            </div>
            
            <p>Votre solde reste inchangé. Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            
            <div style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/automob/wallet" 
                 style="background-color: #3A559F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir mon wallet
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Cet email a été envoyé automatiquement par NettmobFrance.
            </p>
          </div>
        `;

        await sendNotificationEmail(
          automobEmail[0].email,
          '❌ Retrait refusé',
          html
        );
      }
    }

    res.json({ message: 'Retrait refusé' });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

export default router;

import db from '../config/database.js';
import { creditWallet } from './walletService.js';
import { createNotification } from '../utils/notificationHelper.js';
import { sendNotificationEmail } from './emailService.js';

/**
 * Générer un numéro de facture unique
 */
function generateInvoiceNumber(type, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  const prefix = type === 'automob' ? 'FA' : type === 'client' ? 'FC' : 'FG';
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Créer une facture pour un automob
 */
async function createAutomobInvoice(missionId, automobId, timesheetIds) {
  try {
    // 🛡️ GARDE IDEMPOTENCE : Vérifier si une facture automob existe déjà pour cette mission
    const [existingInvoices] = await db.query(
      'SELECT id FROM invoices WHERE mission_id = ? AND automob_id = ? AND commission_rate = 0',
      [missionId, automobId]
    );

    if (existingInvoices.length > 0) {
      console.log(`⚠️ Facture automob déjà existante pour mission ${missionId} / automob ${automobId}. ID: ${existingInvoices[0].id}. Annulation de la création.`);
      return existingInvoices[0].id;
    }

    // Récupérer les informations de la mission
    const [missions] = await db.query(`
      SELECT m.*, u.email as client_email, cp.company_name
      FROM missions m
      JOIN users u ON m.client_id = u.id
      JOIN client_profiles cp ON u.id = cp.user_id
      WHERE m.id = ?
    `, [missionId]);

    if (missions.length === 0) {
      throw new Error('Mission non trouvée');
    }

    const mission = missions[0];

    // Récupérer les timesheets approuvés
    const [timesheets] = await db.query(`
      SELECT * FROM timesheets 
      WHERE id IN (?) AND status = 'approuve' AND automob_id = ?
    `, [timesheetIds, automobId]);

    if (timesheets.length === 0) {
      throw new Error('Aucune feuille de temps approuvée trouvée');
    }

    // Calculer les totaux
    const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.total_hours || 0), 0);
    const overtimeHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.overtime_hours || 0), 0);
    const hourlyRate = parseFloat(mission.hourly_rate);
    const subtotal = totalHours * hourlyRate;
    const totalAmount = subtotal; // Automob reçoit le montant total

    // Période de facturation
    const periodStart = timesheets[0].period_start;
    const periodEnd = timesheets[timesheets.length - 1].period_end;

    // Créer la facture
    const invoiceNumber = generateInvoiceNumber('automob');
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [result] = await db.query(`
      INSERT INTO invoices (
        mission_id, automob_id, client_id, 
        period_start, period_end, total_hours, hourly_rate,
        commission_rate, commission_amount, amount, 
        status, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'en_attente', NOW())
    `, [
      missionId, automobId, mission.client_id,
      periodStart, periodEnd, totalHours, hourlyRate,
      totalAmount
    ]);

    const invoiceId = result.insertId;

    // Ajouter les lignes de facture
    for (const timesheet of timesheets) {
      const normalHours = parseFloat(timesheet.total_hours) - parseFloat(timesheet.overtime_hours || 0);

      // Ligne pour heures normales
      if (normalHours > 0) {
        await db.query(`
          INSERT INTO invoice_items (
            invoice_id, description, timesheet_id, quantity, unit_price, amount, is_overtime
          ) VALUES (?, ?, ?, ?, ?, ?, false)
        `, [
          invoiceId,
          `Heures travaillées - ${new Date(timesheet.period_start).toLocaleDateString('fr-FR')} au ${new Date(timesheet.period_end).toLocaleDateString('fr-FR')}`,
          timesheet.id,
          normalHours,
          hourlyRate,
          normalHours * hourlyRate
        ]);
      }

      // Ligne pour heures supplémentaires
      if (timesheet.overtime_hours > 0) {
        await db.query(`
          INSERT INTO invoice_items (
            invoice_id, description, timesheet_id, quantity, unit_price, amount, is_overtime
          ) VALUES (?, ?, ?, ?, ?, ?, true)
        `, [
          invoiceId,
          `Heures supplémentaires - ${new Date(timesheet.period_start).toLocaleDateString('fr-FR')} au ${new Date(timesheet.period_end).toLocaleDateString('fr-FR')}`,
          timesheet.id,
          timesheet.overtime_hours,
          hourlyRate,
          timesheet.overtime_hours * hourlyRate
        ]);
      }
    }

    // Créditer automatiquement le wallet de l'automob
    try {
      console.log(`💰 Tentative de crédit wallet: ${totalAmount}€ pour automob ${automobId}`);
      const result = await creditWallet(
        automobId,
        totalAmount,
        `Facture ${invoiceNumber} - Mission ${mission.mission_name}`,
        'invoice',
        invoiceId,
        null
      );
      console.log(`✅ Wallet crédité avec succès: ${totalAmount}€ pour automob ${automobId}, nouveau solde: ${result.newBalance}€`);
    } catch (walletError) {
      console.error('❌ Erreur crédit wallet:', walletError);
      // Ne pas bloquer la création de facture si le wallet échoue
    }

    // Récupérer infos automob pour notification
    const [automobInfo] = await db.query(
      'SELECT first_name, last_name FROM automob_profiles WHERE user_id = ?',
      [automobId]
    );
    const [automobUser] = await db.query('SELECT email FROM users WHERE id = ?', [automobId]);
    const automobName = `${automobInfo[0]?.first_name} ${automobInfo[0]?.last_name}`;

    // Notification automob
    await createNotification(
      automobId,
      '📄 Nouvelle facture générée',
      `Votre facture ${invoiceNumber} de ${totalAmount.toFixed(2)}€ a été générée pour la mission "${mission.mission_name}"`,
      'success',
      'payment',
      '/automob/invoices'
    );

    // Email automob
    if (automobUser.length > 0) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3A559F;">📄 Nouvelle facture générée</h2>
          
          <p>Bonjour ${automobName},</p>
          
          <p>Une nouvelle facture a été générée suite à l'approbation de vos heures.</p>
          
          <div style="background-color: #F5F7FB; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3A559F;">
            <p style="margin: 5px 0;"><strong>Numéro de facture:</strong> ${invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Mission:</strong> ${mission.mission_name}</p>
            <p style="margin: 5px 0;"><strong>Période:</strong> ${new Date(periodStart).toLocaleDateString('fr-FR')} au ${new Date(periodEnd).toLocaleDateString('fr-FR')}</p>
            <p style="margin: 5px 0;"><strong>Heures totales:</strong> ${totalHours}h</p>
            <p style="margin: 5px 0; font-size: 18px; color: #16a34a;"><strong>Montant:</strong> ${totalAmount.toFixed(2)}€</p>
          </div>
          
          <p>💰 Le montant a été automatiquement crédité sur votre wallet.</p>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/automob/invoices" 
               style="background-color: #3A559F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
              Voir mes factures
            </a>
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
        automobUser[0].email,
        '📄 Nouvelle facture générée',
        html
      );
    }

    return invoiceId;
  } catch (error) {
    console.error('Erreur création facture automob:', error);
    throw error;
  }
}

/**
 * Créer une facture pour un client
 */
async function createClientInvoice(missionId, automobId, timesheetIds) {
  try {
    // 🛡️ GARDE IDEMPOTENCE : Vérifier si une facture client existe déjà pour cet automob
    const [existingInvoices] = await db.query(
      'SELECT id FROM invoices WHERE mission_id = ? AND automob_id = ? AND commission_rate > 0',
      [missionId, automobId]
    );

    if (existingInvoices.length > 0) {
      console.log(`⚠️ Facture client déjà existante pour mission ${missionId} / automob ${automobId}. ID: ${existingInvoices[0].id}. Annulation de la création.`);
      return existingInvoices[0].id;
    }

    // Récupérer les informations de la mission
    const [missions] = await db.query(`
      SELECT m.*, u.email as automob_email, 
             ap.first_name, ap.last_name
      FROM missions m
      JOIN users u ON m.client_id = u.id
      LEFT JOIN automob_profiles ap ON ap.user_id = ?
      WHERE m.id = ?
    `, [automobId, missionId]);

    if (missions.length === 0) {
      throw new Error('Mission non trouvée');
    }

    const mission = missions[0];

    // Récupérer les timesheets approuvés
    const [timesheets] = await db.query(`
      SELECT * FROM timesheets 
      WHERE id IN (?) AND status = 'approuve' AND automob_id = ?
    `, [timesheetIds, automobId]);

    if (timesheets.length === 0) {
      throw new Error('Aucune feuille de temps approuvée trouvée');
    }

    // Calculer les totaux
    const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.total_hours || 0), 0);
    const hourlyRate = parseFloat(mission.hourly_rate);
    const subtotal = totalHours * hourlyRate;
    const commissionRate = 20.00;
    const commissionAmount = subtotal * (commissionRate / 100);

    // Période de facturation
    const periodStart = timesheets[0].period_start;
    const periodEnd = timesheets[timesheets.length - 1].period_end;

    // Créer la facture
    const invoiceNumber = generateInvoiceNumber('client');
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [result] = await db.query(`
      INSERT INTO invoices (
        mission_id, automob_id, client_id, 
        period_start, period_end, total_hours, hourly_rate,
        commission_rate, commission_amount, amount, 
        status, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', NOW())
    `, [
      missionId, automobId, mission.client_id,
      periodStart, periodEnd, totalHours, hourlyRate,
      commissionRate, commissionAmount, subtotal  // Enregistrer subtotal (sans commission) dans amount
    ]);

    const invoiceId = result.insertId;

    // Ajouter les lignes de facture
    for (const timesheet of timesheets) {
      const normalHours = parseFloat(timesheet.total_hours) - parseFloat(timesheet.overtime_hours || 0);

      if (normalHours > 0) {
        await db.query(`
          INSERT INTO invoice_items (
            invoice_id, description, timesheet_id, quantity, unit_price, amount, is_overtime
          ) VALUES (?, ?, ?, ?, ?, ?, false)
        `, [
          invoiceId,
          `Heures travaillées - ${new Date(timesheet.period_start).toLocaleDateString('fr-FR')} au ${new Date(timesheet.period_end).toLocaleDateString('fr-FR')}`,
          timesheet.id,
          normalHours,
          hourlyRate,
          normalHours * hourlyRate
        ]);
      }

      if (timesheet.overtime_hours > 0) {
        await db.query(`
          INSERT INTO invoice_items (
            invoice_id, description, timesheet_id, quantity, unit_price, amount, is_overtime
          ) VALUES (?, ?, ?, ?, ?, ?, true)
        `, [
          invoiceId,
          `Heures supplémentaires - ${new Date(timesheet.period_start).toLocaleDateString('fr-FR')} au ${new Date(timesheet.period_end).toLocaleDateString('fr-FR')}`,
          timesheet.id,
          timesheet.overtime_hours,
          hourlyRate,
          timesheet.overtime_hours * hourlyRate
        ]);
      }
    }

    // Ajouter la ligne de commission
    await db.query(`
      INSERT INTO invoice_items (
        invoice_id, description, timesheet_id, quantity, unit_price, amount, is_overtime
      ) VALUES (?, ?, NULL, 1, ?, ?, false)
    `, [
      invoiceId,
      'Commission NettmobFrance (20%)',
      commissionAmount,
      commissionAmount
    ]);

    // Récupérer infos client pour notification
    const [clientInfo] = await db.query(
      'SELECT company_name FROM client_profiles WHERE user_id = ?',
      [mission.client_id]
    );
    const [clientUser] = await db.query('SELECT email FROM users WHERE id = ?', [mission.client_id]);
    const clientName = clientInfo[0]?.company_name || 'Client';

    // Notification client
    await createNotification(
      mission.client_id,
      '📄 Nouvelle facture générée',
      `Votre facture ${invoiceNumber} de ${(subtotal + commissionAmount).toFixed(2)}€ a été générée pour la mission "${mission.mission_name}"`,
      'info',
      'payment',
      '/client/invoices'
    );

    // Email client
    if (clientUser.length > 0) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #A52450;">📄 Nouvelle facture générée</h2>
          
          <p>Bonjour ${clientName},</p>
          
          <p>Une nouvelle facture a été générée suite à l'approbation des heures de votre mission.</p>
          
          <div style="background-color: #FFF5F8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #A52450;">
            <p style="margin: 5px 0;"><strong>Numéro de facture:</strong> ${invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Mission:</strong> ${mission.mission_name}</p>
            <p style="margin: 5px 0;"><strong>Période:</strong> ${new Date(periodStart).toLocaleDateString('fr-FR')} au ${new Date(periodEnd).toLocaleDateString('fr-FR')}</p>
            <p style="margin: 5px 0;"><strong>Heures totales:</strong> ${totalHours}h</p>
            <p style="margin: 5px 0;"><strong>Sous-total:</strong> ${subtotal.toFixed(2)}€</p>
            <p style="margin: 5px 0;"><strong>Commission (20%):</strong> ${commissionAmount.toFixed(2)}€</p>
            <p style="margin: 5px 0; font-size: 18px; color: #A52450;"><strong>Total TTC:</strong> ${(subtotal + commissionAmount).toFixed(2)}€</p>
          </div>
          
          <p>Cette facture est disponible dans votre espace client.</p>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/client/invoices" 
               style="background-color: #A52450; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir mes factures
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Cet email a été envoyé automatiquement par NettmobFrance.
          </p>
        </div>
      `;

      await sendNotificationEmail(
        clientUser[0].email,
        '📄 Nouvelle facture générée',
        html
      );
    }

    return invoiceId;
  } catch (error) {
    console.error('Erreur création facture client:', error);
    throw error;
  }
}

/**
 * Créer une facture récapitulative admin pour une mission
 */
async function createAdminSummaryInvoice(missionId) {
  try {
    // Récupérer toutes les factures client pour cette mission
    const [clientInvoices] = await db.query(`
      SELECT i.*, ap.first_name, ap.last_name
      FROM invoices i
      LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
      WHERE i.mission_id = ? AND i.invoice_type = 'client' AND i.status = 'issued'
    `, [missionId]);

    if (clientInvoices.length === 0) {
      throw new Error('Aucune facture client trouvée pour cette mission');
    }

    // Calculer les totaux
    const totalHours = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_hours || 0), 0);
    const totalSubtotal = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.subtotal || 0), 0);
    const totalCommission = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.commission_amount || 0), 0);
    const totalAmount = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

    // Récupérer info mission
    const [missions] = await db.query('SELECT * FROM missions WHERE id = ?', [missionId]);
    const mission = missions[0];

    // Créer la facture récapitulative
    const invoiceNumber = generateInvoiceNumber('admin');
    const issueDate = new Date().toISOString().split('T')[0];

    const [result] = await db.query(`
      INSERT INTO invoices (
        invoice_number, invoice_type, mission_id, client_id,
        period_start, period_end, total_hours, hourly_rate,
        subtotal, commission_rate, commission_amount, total_amount,
        status, issue_date
      ) VALUES (?, 'admin_summary', ?, ?, ?, ?, ?, 0, ?, 20, ?, ?, 'issued', ?)
    `, [
      invoiceNumber, missionId, mission.client_id,
      clientInvoices[0].period_start, clientInvoices[clientInvoices.length - 1].period_end,
      totalHours, totalSubtotal, totalCommission, totalAmount, issueDate
    ]);

    const invoiceId = result.insertId;

    // Ajouter les détails par automob
    for (const clientInv of clientInvoices) {
      await db.query(`
        INSERT INTO admin_invoice_summary (invoice_id, automob_id, total_hours, amount_to_pay)
        VALUES (?, ?, ?, ?)
      `, [invoiceId, clientInv.automob_id, clientInv.total_hours, clientInv.subtotal]);
    }

    return invoiceId;
  } catch (error) {
    console.error('Erreur création facture admin:', error);
    throw error;
  }
}

export {
  generateInvoiceNumber,
  createAutomobInvoice,
  createClientInvoice,
  createAdminSummaryInvoice
};

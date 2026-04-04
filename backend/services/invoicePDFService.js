import db from '../config/database.js';

/**
 * Générer le HTML pour une facture automob
 */
async function generateAutomobInvoiceHTML(invoiceId) {
  const [invoices] = await db.query(`
    SELECT i.*, 
           m.mission_name, m.title as mission_title,
           cp.company_name as client_company,
           u.email as client_email,
           ap.first_name as automob_first_name,
           ap.last_name as automob_last_name,
           ap.address as automob_address,
           ap.phone as automob_phone
    FROM invoices i
    JOIN missions m ON i.mission_id = m.id
    JOIN users u ON i.client_id = u.id
    JOIN client_profiles cp ON u.id = cp.user_id
    LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
    WHERE i.id = ?
  `, [invoiceId]);

  if (invoices.length === 0) {
    throw new Error('Facture non trouvée');
  }

  const invoice = invoices[0];
  
  // Générer numéro de facture
  const invoiceNumber = `AUT-${String(invoice.id).padStart(6, '0')}`;
  const issueDate = new Date(invoice.generated_at);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);

  // Récupérer les lignes de facture
  const [items] = await db.query(`
    SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY is_overtime, id
  `, [invoiceId]);

  const normalItems = items.filter(item => !item.is_overtime);
  const overtimeItems = items.filter(item => item.is_overtime);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; align-items: flex-start; }
    .company-info { font-size: 14px; }
    .logo { width: 150px; height: auto; margin-bottom: 15px; }
    .company-name { font-size: 24px; font-weight: bold; color: #3A559F; margin-bottom: 10px; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #3A559F; margin-bottom: 20px; }
    .invoice-details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .invoice-details table { width: 100%; }
    .invoice-details td { padding: 5px 0; }
    .invoice-details td:first-child { font-weight: bold; width: 150px; }
    .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px; color: #3A559F; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table.items th { background: #3A559F; color: white; padding: 12px; text-align: left; }
    table.items td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    table.items tr:hover { background: #f9fafb; }
    .overtime-section { background: #fff7ed; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0; }
    .overtime-section h3 { color: #ea580c; margin: 0 0 10px 0; }
    .totals { margin-top: 30px; text-align: right; }
    .totals table { margin-left: auto; width: 350px; }
    .totals td { padding: 8px; }
    .totals .total-row { font-size: 20px; font-weight: bold; background: #E8EEF7; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .text-right { text-align: right; }
    .text-orange { color: #ea580c; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <img src="${process.env.FRONTEND_URL}/logo-nettmobfrance.png" alt="NettmobFrance" class="logo" onerror="this.style.display='none'" />
      <div class="company-name">NettmobFrance</div>
      <div>Plateforme de mise en relation</div>
      <div>34 Av. des Champs-Élysées</div>
      <div>75008 Paris, France</div>
      <div>contact@nettmobfrance.fr</div>
      <div>SIRET: 888 919 693 00026</div>
      <div>TVA: FR74888919693</div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">FACTURE</div>
      <div><strong>N°:</strong> ${invoiceNumber}</div>
      <div><strong>Date:</strong> ${issueDate.toLocaleDateString('fr-FR')}</div>
      <div><strong>Échéance:</strong> ${dueDate.toLocaleDateString('fr-FR')}</div>
    </div>
  </div>

  <div class="invoice-details">
    <table>
      <tr>
        <td><strong>Prestataire:</strong></td>
        <td>
          ${invoice.automob_first_name} ${invoice.automob_last_name}<br/>
          ${invoice.automob_address || ''}<br/>
          ${invoice.automob_phone || ''}
        </td>
      </tr>
      <tr>
        <td><strong>Client final:</strong></td>
        <td>${invoice.client_company}</td>
      </tr>
      <tr>
        <td><strong>Mission:</strong></td>
        <td>${invoice.mission_name || invoice.mission_title}</td>
      </tr>
      <tr>
        <td><strong>Période:</strong></td>
        <td>${invoice.period_start ? new Date(invoice.period_start).toLocaleDateString('fr-FR') : ''} - ${invoice.period_end ? new Date(invoice.period_end).toLocaleDateString('fr-FR') : ''}</td>
      </tr>
    </table>
  </div>

  <div class="section-title">Détail des prestations</div>
  
  ${normalItems.length > 0 ? `
  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Quantité (h)</th>
        <th style="text-align: right;">Prix unitaire</th>
        <th style="text-align: right;">Montant HT</th>
      </tr>
    </thead>
    <tbody>
      ${normalItems.map(item => `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: center;">${parseFloat(item.quantity).toFixed(2)}h</td>
          <td style="text-align: right;">${parseFloat(item.unit_price).toFixed(2)}€</td>
          <td style="text-align: right;">${parseFloat(item.amount).toFixed(2)}€</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${overtimeItems.length > 0 ? `
  <div class="overtime-section">
    <h3>⚠️ Heures supplémentaires</h3>
    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Quantité (h)</th>
          <th style="text-align: right;">Prix unitaire</th>
          <th style="text-align: right;">Montant HT</th>
        </tr>
      </thead>
      <tbody>
        ${overtimeItems.map(item => `
          <tr>
            <td class="text-orange">${item.description}</td>
            <td style="text-align: center;" class="text-orange">${parseFloat(item.quantity).toFixed(2)}h</td>
            <td style="text-align: right;">${parseFloat(item.unit_price).toFixed(2)}€</td>
            <td style="text-align: right;" class="text-orange">${parseFloat(item.amount).toFixed(2)}€</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="totals">
    <table>
      <tr>
        <td>Total heures:</td>
        <td class="text-right"><strong>${invoice.total_hours ? parseFloat(invoice.total_hours).toFixed(2) : '0.00'}h</strong></td>
      </tr>
      <tr>
        <td>Tarif horaire:</td>
        <td class="text-right">${invoice.hourly_rate ? parseFloat(invoice.hourly_rate).toFixed(2) : '0.00'}€/h</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL À RECEVOIR:</td>
        <td class="text-right">${invoice.amount ? parseFloat(invoice.amount).toFixed(2) : '0.00'}€</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p><strong>Conditions de paiement:</strong> Paiement sous 30 jours</p>
    <p>Cette facture représente le montant que vous recevrez pour vos prestations via NettmobFrance.</p>
    <p><strong>NettmobFrance</strong> - Plateforme de mise en relation professionnelle</p>
    <p>TVA non applicable, article 293 B du CGI</p>
  </div>
</body>
</html>
  `;
}

/**
 * Générer le HTML pour une facture client
 */
async function generateClientInvoiceHTML(invoiceId) {
  const [invoices] = await db.query(`
    SELECT i.*, 
           m.mission_name, m.title as mission_title,
           cp.company_name as client_company,
           cp.address as client_address,
           cp.siret as client_siret,
           u.email as client_email,
           ap.first_name as automob_first_name,
           ap.last_name as automob_last_name
    FROM invoices i
    JOIN missions m ON i.mission_id = m.id
    JOIN users u ON i.client_id = u.id
    JOIN client_profiles cp ON u.id = cp.user_id
    LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
    WHERE i.id = ?
  `, [invoiceId]);

  if (invoices.length === 0) {
    throw new Error('Facture non trouvée');
  }

  const invoice = invoices[0];
  
  // Générer numéro de facture
  const invoiceNumber = `CLI-${String(invoice.id).padStart(6, '0')}`;
  const issueDate = new Date(invoice.generated_at);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);

  // Calculer montants avec commission
  const montantBase = invoice.amount ? parseFloat(invoice.amount) : 0;
  const commissionRate = invoice.commission_rate ? parseFloat(invoice.commission_rate) : 20;
  const commission = montantBase * (commissionRate / 100);
  const montantHT = montantBase + commission;
  const tva = montantHT * 0.20; // TVA 20%
  const montantTTC = montantHT + tva;

  // Récupérer les lignes de facture
  const [items] = await db.query(`
    SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY is_overtime, id
  `, [invoiceId]);

  const workItems = items.filter(item => item.description.includes('Heures'));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; align-items: flex-start; }
    .company-info { font-size: 14px; }
    .logo { width: 150px; height: auto; margin-bottom: 15px; }
    .company-name { font-size: 24px; font-weight: bold; color: #3A559F; margin-bottom: 10px; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #3A559F; margin-bottom: 20px; }
    .invoice-details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .invoice-details table { width: 100%; }
    .invoice-details td { padding: 5px 0; }
    .invoice-details td:first-child { font-weight: bold; width: 150px; }
    .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px; color: #3A559F; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table.items th { background: #3A559F; color: white; padding: 12px; text-align: left; }
    table.items td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    table.items tr:hover { background: #f9fafb; }
    .commission-row { background: #fef3c7; font-weight: bold; }
    .totals { margin-top: 30px; text-align: right; }
    .totals table { margin-left: auto; width: 400px; }
    .totals td { padding: 8px; }
    .totals .subtotal-row { border-top: 1px solid #d1d5db; }
    .totals .total-row { font-size: 20px; font-weight: bold; background: #E8EEF7; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .text-right { text-align: right; }
    .text-orange { color: #ea580c; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <img src="${process.env.FRONTEND_URL}/logo-nettmobfrance.png" alt="NettmobFrance" class="logo" onerror="this.style.display='none'" />
      <div class="company-name">NettmobFrance</div>
      <div>Plateforme de mise en relation</div>
      <div>34 Av. des Champs-Élysées</div>
      <div>75008 Paris, France</div>
      <div>contact@nettmobfrance.fr</div>
      <div>SIRET: 888 919 693 00026</div>
      <div>TVA: FR74888919693</div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">FACTURE</div>
      <div><strong>N°:</strong> ${invoiceNumber}</div>
      <div><strong>Date:</strong> ${issueDate.toLocaleDateString('fr-FR')}</div>
      <div><strong>Échéance:</strong> ${dueDate.toLocaleDateString('fr-FR')}</div>
    </div>
  </div>

  <div class="invoice-details">
    <table>
      <tr>
        <td><strong>Client:</strong></td>
        <td>
          ${invoice.client_company}<br/>
          ${invoice.client_address || ''}<br/>
          ${invoice.client_siret ? 'SIRET: ' + invoice.client_siret : ''}
        </td>
      </tr>
      <tr>
        <td><strong>Prestataire:</strong></td>
        <td>${invoice.automob_first_name} ${invoice.automob_last_name}</td>
      </tr>
      <tr>
        <td><strong>Mission:</strong></td>
        <td>${invoice.mission_name || invoice.mission_title}</td>
      </tr>
      <tr>
        <td><strong>Période:</strong></td>
        <td>${invoice.period_start ? new Date(invoice.period_start).toLocaleDateString('fr-FR') : ''} - ${invoice.period_end ? new Date(invoice.period_end).toLocaleDateString('fr-FR') : ''}</td>
      </tr>
    </table>
  </div>

  <div class="section-title">Détail des prestations</div>
  
  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Quantité (h)</th>
        <th style="text-align: right;">Prix unitaire</th>
        <th style="text-align: right;">Montant HT</th>
      </tr>
    </thead>
    <tbody>
      ${workItems.map(item => `
        <tr>
          <td ${item.is_overtime ? 'class="text-orange"' : ''}>${item.description}</td>
          <td style="text-align: center;" ${item.is_overtime ? 'class="text-orange"' : ''}>${parseFloat(item.quantity).toFixed(2)}h</td>
          <td style="text-align: right;">${parseFloat(item.unit_price).toFixed(2)}€</td>
          <td style="text-align: right;" ${item.is_overtime ? 'class="text-orange"' : ''}>${parseFloat(item.amount).toFixed(2)}€</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>Total heures:</td>
        <td class="text-right"><strong>${invoice.total_hours ? parseFloat(invoice.total_hours).toFixed(2) : '0.00'}h</strong></td>
      </tr>
      <tr>
        <td>Tarif horaire:</td>
        <td class="text-right">${invoice.hourly_rate ? parseFloat(invoice.hourly_rate).toFixed(2) : '0.00'}€/h</td>
      </tr>
      <tr>
        <td>Sous-total prestations:</td>
        <td class="text-right">${montantBase.toFixed(2)}€</td>
      </tr>
      <tr class="commission-row">
        <td>Commission NettmobFrance (${commissionRate.toFixed(0)}%):</td>
        <td class="text-right">${commission.toFixed(2)}€</td>
      </tr>
      <tr class="subtotal-row">
        <td>Total HT:</td>
        <td class="text-right">${montantHT.toFixed(2)}€</td>
      </tr>
      <tr>
        <td>TVA (20%):</td>
        <td class="text-right">${tva.toFixed(2)}€</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL TTC À PAYER:</td>
        <td class="text-right">${montantTTC.toFixed(2)}€</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p><strong>Conditions de paiement:</strong> Paiement sous 30 jours</p>
    <p>Montant incluant la commission de plateforme NettmobFrance (${commissionRate.toFixed(0)}%) et la TVA à 20%.</p>
    <p style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107; color: #856404;">
      <strong>ℹ️ Information importante:</strong> Un responsable de NettmobFrance vous contactera prochainement pour effectuer le paiement de cette facture.
    </p>
    <p style="margin-top: 15px;"><strong>NettmobFrance</strong> - 34 Av. des Champs-Élysées, 75008 Paris, France</p>
    <p>SIRET: 888 919 693 00026 - TVA: FR74888919693</p>
  </div>
</body>
</html>
  `;
}

/**
 * Générer le HTML pour une facture récapitulative admin
 */
async function generateAdminSummaryInvoiceHTML(invoiceId) {
  const [invoices] = await db.query(`
    SELECT i.*, 
           m.mission_name, m.title as mission_title,
           cp.company_name as client_company
    FROM invoices i
    JOIN missions m ON i.mission_id = m.id
    JOIN users u ON i.client_id = u.id
    JOIN client_profiles cp ON u.id = cp.user_id
    WHERE i.id = ?
  `, [invoiceId]);

  if (invoices.length === 0) {
    throw new Error('Facture non trouvée');
  }

  const invoice = invoices[0];
  
  // Générer numéro de facture
  const invoiceNumber = `ADM-${String(invoice.id).padStart(6, '0')}`;
  const issueDate = new Date(invoice.generated_at);

  // Récupérer les détails par automob
  const [automobDetails] = await db.query(`
    SELECT ais.*, ap.first_name, ap.last_name
    FROM admin_invoice_summary ais
    LEFT JOIN automob_profiles ap ON ais.automob_id = ap.user_id
    WHERE ais.invoice_id = ?
  `, [invoiceId]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; align-items: flex-start; }
    .company-info { font-size: 14px; }
    .logo { width: 150px; height: auto; margin-bottom: 15px; }
    .company-name { font-size: 24px; font-weight: bold; color: #7c3aed; margin-bottom: 10px; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #7c3aed; margin-bottom: 20px; }
    .invoice-details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .invoice-details table { width: 100%; }
    .invoice-details td { padding: 5px 0; }
    .invoice-details td:first-child { font-weight: bold; width: 150px; }
    .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px; color: #7c3aed; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table.items th { background: #7c3aed; color: white; padding: 12px; text-align: left; }
    table.items td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    table.items tr:hover { background: #f9fafb; }
    .totals { margin-top: 30px; background: #faf5ff; padding: 20px; border-radius: 8px; }
    .totals table { width: 100%; }
    .totals td { padding: 8px; }
    .totals .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #7c3aed; }
    .totals .commission-row { background: #fef3c7; font-weight: bold; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .text-right { text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <img src="${process.env.FRONTEND_URL}/logo-nettmobfrance.png" alt="NettmobFrance" class="logo" onerror="this.style.display='none'" />
      <div class="company-name">NettmobFrance</div>
      <div>Plateforme de mise en relation</div>
      <div>34 Av. des Champs-Élysées, 75008 Paris, France</div>
      <div>contact@nettmobfrance.fr</div>
      <div>SIRET: 888 919 693 00026 - TVA: FR74888919693</div>
      <div style="margin-top: 10px; color: #7c3aed; font-weight: bold;">FACTURE RÉCAPITULATIVE ADMIN</div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">RÉCAPITULATIF</div>
      <div><strong>N°:</strong> ${invoiceNumber}</div>
      <div><strong>Date:</strong> ${issueDate.toLocaleDateString('fr-FR')}</div>
    </div>
  </div>

  <div class="invoice-details">
    <table>
      <tr>
        <td><strong>Client:</strong></td>
        <td>${invoice.client_company}</td>
      </tr>
      <tr>
        <td><strong>Mission:</strong></td>
        <td>${invoice.mission_name || invoice.mission_title}</td>
      </tr>
      <tr>
        <td><strong>Période:</strong></td>
        <td>${invoice.period_start ? new Date(invoice.period_start).toLocaleDateString('fr-FR') : ''} - ${invoice.period_end ? new Date(invoice.period_end).toLocaleDateString('fr-FR') : ''}</td>
      </tr>
    </table>
  </div>

  <div class="section-title">Détail par Automob</div>
  
  <table class="items">
    <thead>
      <tr>
        <th>Automob</th>
        <th style="text-align: center;">Heures travaillées</th>
        <th style="text-align: right;">Montant à payer</th>
      </tr>
    </thead>
    <tbody>
      ${automobDetails.map(detail => `
        <tr>
          <td>${detail.first_name} ${detail.last_name}</td>
          <td style="text-align: center;">${parseFloat(detail.total_hours).toFixed(2)}h</td>
          <td style="text-align: right;">${parseFloat(detail.amount_to_pay).toFixed(2)}€</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td><strong>Total heures mission:</strong></td>
        <td class="text-right">${invoice.total_hours ? parseFloat(invoice.total_hours).toFixed(2) : '0.00'}h</td>
      </tr>
      <tr>
        <td><strong>Total à payer aux automobs:</strong></td>
        <td class="text-right">${invoice.amount ? (parseFloat(invoice.amount) - parseFloat(invoice.commission_amount || 0)).toFixed(2) : '0.00'}€</td>
      </tr>
      <tr class="commission-row">
        <td><strong>Commission NettmobFrance (${invoice.commission_rate ? parseFloat(invoice.commission_rate).toFixed(0) : '20'}%):</strong></td>
        <td class="text-right">${invoice.commission_amount ? parseFloat(invoice.commission_amount).toFixed(2) : '0.00'}€</td>
      </tr>
      <tr class="total-row">
        <td><strong>TOTAL FACTURÉ AU CLIENT:</strong></td>
        <td class="text-right">${invoice.amount ? parseFloat(invoice.amount).toFixed(2) : '0.00'}€</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p><strong>Récapitulatif administratif</strong></p>
    <p>Ce document récapitule l'ensemble des prestations pour cette mission.</p>
    <p>Nombre d'automobs: ${automobDetails.length}</p>
    <p>NettmobFrance - Plateforme de mise en relation professionnelle</p>
  </div>
</body>
</html>
  `;
}

export {
  generateAutomobInvoiceHTML,
  generateClientInvoiceHTML,
  generateAdminSummaryInvoiceHTML
};

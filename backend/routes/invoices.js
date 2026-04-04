import express from 'express';
import db from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { 
  createAutomobInvoice, 
  createClientInvoice, 
  createAdminSummaryInvoice 
} from '../services/invoiceService.js';
import {
  generateAutomobInvoiceHTML,
  generateClientInvoiceHTML,
  generateAdminSummaryInvoiceHTML
} from '../services/invoicePDFService.js';

const router = express.Router();

// ============ AUTOMOB ROUTES ============

// Get automob's invoices
router.get('/automob/my-invoices', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const [invoices] = await db.query(`
      SELECT i.*, 
             m.mission_name, m.title as mission_title,
             cp.company_name as client_company
      FROM invoices i
      JOIN missions m ON i.mission_id = m.id
      JOIN users u ON i.client_id = u.id
      JOIN client_profiles cp ON u.id = cp.user_id
      WHERE i.automob_id = ? AND i.commission_rate = 0
      ORDER BY i.generated_at DESC
    `, [req.user.id]);

    console.log(`📄 Factures automob trouvées: ${invoices.length} pour user ${req.user.id}`);
    res.json(invoices);
  } catch (error) {
    console.error('Get automob invoices error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get automob invoice details
router.get('/automob/:invoiceId', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const [invoices] = await db.query(`
      SELECT i.*, 
             m.mission_name, m.title as mission_title,
             cp.company_name as client_company,
             u.email as client_email
      FROM invoices i
      JOIN missions m ON i.mission_id = m.id
      JOIN users u ON i.client_id = u.id
      JOIN client_profiles cp ON u.id = cp.user_id
      WHERE i.id = ? AND i.automob_id = ?
    `, [req.params.invoiceId, req.user.id]);

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Get invoice items
    const [items] = await db.query(`
      SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY is_overtime, id
    `, [req.params.invoiceId]);

    res.json({
      ...invoices[0],
      items
    });
  } catch (error) {
    console.error('Get automob invoice error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Generate automob invoice
router.post('/automob/generate', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const { missionId, timesheetIds } = req.body;

    if (!missionId || !timesheetIds || timesheetIds.length === 0) {
      return res.status(400).json({ error: 'Mission et feuilles de temps requises' });
    }

    const invoiceId = await createAutomobInvoice(missionId, req.user.id, timesheetIds);
    res.status(201).json({ message: 'Facture créée', invoiceId });
  } catch (error) {
    console.error('Generate automob invoice error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Get automob invoice HTML (for PDF generation)
router.get('/automob/:invoiceId/html', authenticateToken, authorizeRoles('automob', 'admin'), async (req, res) => {
  try {
    // Verify ownership (skip for admin)
    if (req.user.role !== 'admin') {
      const [invoices] = await db.query(
        'SELECT * FROM invoices WHERE id = ? AND automob_id = ?',
        [req.params.invoiceId, req.user.id]
      );

      if (invoices.length === 0) {
        return res.status(404).json({ error: 'Facture non trouvée' });
      }
    }

    const html = await generateAutomobInvoiceHTML(req.params.invoiceId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Get automob invoice HTML error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ CLIENT ROUTES ============

// Get client's invoices
router.get('/client/my-invoices', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    console.log(`📋 Début récupération factures client pour user ${req.user?.id}`);
    
    if (!req.user || !req.user.id) {
      console.error('❌ req.user ou req.user.id est undefined');
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    
    const [invoices] = await db.query(`
      SELECT i.*, 
             m.mission_name, m.title as mission_title,
             ap.first_name as automob_first_name,
             ap.last_name as automob_last_name
      FROM invoices i
      JOIN missions m ON i.mission_id = m.id
      LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
      WHERE i.client_id = ? AND i.commission_rate > 0
      ORDER BY i.generated_at DESC
    `, [req.user.id]);

    console.log(`✅ Factures client trouvées: ${invoices.length} pour user ${req.user.id}`);
    res.json(invoices);
  } catch (error) {
    console.error('❌ Get client invoices error:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Get invoices by mission for client
router.get('/client/mission/:missionId', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    // Verify mission ownership
    const [missions] = await db.query(
      'SELECT * FROM missions WHERE id = ? AND client_id = ?',
      [req.params.missionId, req.user.id]
    );

    if (missions.length === 0) {
      return res.status(404).json({ error: 'Mission non trouvée' });
    }

    const [invoices] = await db.query(`
      SELECT i.*, 
             ap.first_name as automob_first_name,
             ap.last_name as automob_last_name
      FROM invoices i
      LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
      WHERE i.mission_id = ? AND i.commission_rate > 0
      ORDER BY i.generated_at DESC
    `, [req.params.missionId]);

    res.json(invoices);
  } catch (error) {
    console.error('Get mission invoices error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get client invoice details
router.get('/client/:invoiceId', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    const [invoices] = await db.query(`
      SELECT i.*, 
             m.mission_name, m.title as mission_title,
             ap.first_name as automob_first_name,
             ap.last_name as automob_last_name
      FROM invoices i
      JOIN missions m ON i.mission_id = m.id
      LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
      WHERE i.id = ? AND i.client_id = ? AND i.commission_rate > 0
    `, [req.params.invoiceId, req.user.id]);

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Get invoice items
    const [items] = await db.query(`
      SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY is_overtime, id
    `, [req.params.invoiceId]);

    res.json({
      ...invoices[0],
      items
    });
  } catch (error) {
    console.error('Get client invoice error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Generate client invoice
router.post('/client/generate', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    const { missionId, automobId, timesheetIds } = req.body;

    if (!missionId || !automobId || !timesheetIds || timesheetIds.length === 0) {
      return res.status(400).json({ error: 'Données requises manquantes' });
    }

    // Verify mission ownership
    const [missions] = await db.query(
      'SELECT * FROM missions WHERE id = ? AND client_id = ?',
      [missionId, req.user.id]
    );

    if (missions.length === 0) {
      return res.status(403).json({ error: 'Mission non trouvée' });
    }

    const invoiceId = await createClientInvoice(missionId, automobId, timesheetIds);
    res.status(201).json({ message: 'Facture créée', invoiceId });
  } catch (error) {
    console.error('Generate client invoice error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Get client invoice HTML
router.get('/client/:invoiceId/html', authenticateToken, authorizeRoles('client', 'admin'), async (req, res) => {
  try {
    // Verify ownership (skip for admin)
    if (req.user.role !== 'admin') {
      const [invoices] = await db.query(
        'SELECT * FROM invoices WHERE id = ? AND client_id = ? AND commission_rate > 0',
        [req.params.invoiceId, req.user.id]
      );

      if (invoices.length === 0) {
        return res.status(404).json({ error: 'Facture non trouvée' });
      }
    }

    const html = await generateClientInvoiceHTML(req.params.invoiceId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Get client invoice HTML error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ ADMIN ROUTES ============

// Get all invoices (admin)
router.get('/admin/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('📋 Admin: Récupération de toutes les factures');
    
    const [invoices] = await db.query(`
      SELECT i.*, 
             m.mission_name, m.title as mission_title,
             cp.company_name as client_company,
             ap.first_name as automob_first_name,
             ap.last_name as automob_last_name,
             CASE
               WHEN i.commission_rate > 0 THEN 'client'
               ELSE 'automob'
             END as invoice_type
      FROM invoices i
      JOIN missions m ON i.mission_id = m.id
      JOIN users u ON i.client_id = u.id
      JOIN client_profiles cp ON u.id = cp.user_id
      LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
      ORDER BY i.generated_at DESC
    `);

    console.log(`✅ Admin: ${invoices.length} factures trouvées`);
    res.json(invoices);
  } catch (error) {
    console.error('❌ Get all invoices error:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Get admin summary invoices
router.get('/admin/summaries', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [invoices] = await db.query(`
      SELECT i.*, 
             m.mission_name, m.title as mission_title,
             cp.company_name as client_company
      FROM invoices i
      JOIN missions m ON i.mission_id = m.id
      JOIN users u ON i.client_id = u.id
      JOIN client_profiles cp ON u.id = cp.user_id
      ORDER BY i.generated_at DESC
    `);

    res.json(invoices);
  } catch (error) {
    console.error('Get admin summaries error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get admin summary invoice details
router.get('/admin/summary/:invoiceId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [invoices] = await db.query(`
      SELECT i.*, 
             m.mission_name, m.title as mission_title,
             cp.company_name as client_company
      FROM invoices i
      JOIN missions m ON i.mission_id = m.id
      JOIN users u ON i.client_id = u.id
      JOIN client_profiles cp ON u.id = cp.user_id
      WHERE i.id = ?
    `, [req.params.invoiceId]);

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Get automob details
    const [automobDetails] = await db.query(`
      SELECT ais.*, ap.first_name, ap.last_name
      FROM admin_invoice_summary ais
      LEFT JOIN automob_profiles ap ON ais.automob_id = ap.user_id
      WHERE ais.invoice_id = ?
    `, [req.params.invoiceId]);

    res.json({
      ...invoices[0],
      automobDetails
    });
  } catch (error) {
    console.error('Get admin summary error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Generate admin summary invoice
router.post('/admin/generate-summary', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { missionId } = req.body;

    if (!missionId) {
      return res.status(400).json({ error: 'Mission requise' });
    }

    const invoiceId = await createAdminSummaryInvoice(missionId);
    res.status(201).json({ message: 'Facture récapitulative créée', invoiceId });
  } catch (error) {
    console.error('Generate admin summary error:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Get admin summary invoice HTML
router.get('/admin/summary/:invoiceId/html', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [invoices] = await db.query(
      'SELECT * FROM invoices WHERE id = ?',
      [req.params.invoiceId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const html = await generateAdminSummaryInvoiceHTML(req.params.invoiceId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Get admin summary HTML error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update invoice status (admin only)
router.put('/:invoiceId/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const { invoiceId } = req.params;

    // Valider le statut
    const validStatuses = ['en_attente', 'payee', 'annulee', 'draft', 'issued', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // Mettre à jour le statut
    const [result] = await db.query(
      'UPDATE invoices SET status = ? WHERE id = ?',
      [status, invoiceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    console.log(`✅ Facture ${invoiceId} mise à jour: statut → ${status}`);
    res.json({ message: 'Statut mis à jour', invoiceId, status });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get invoices by mission (admin)
router.get('/admin/mission/:missionId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [invoices] = await db.query(`
      SELECT i.*, 
             ap.first_name as automob_first_name,
             ap.last_name as automob_last_name
      FROM invoices i
      LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
      WHERE i.mission_id = ?
      ORDER BY i.generated_at DESC
    `, [req.params.missionId]);

    res.json(invoices);
  } catch (error) {
    console.error('Get mission invoices (admin) error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

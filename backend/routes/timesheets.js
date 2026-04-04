import express from 'express';
import db from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  sendTimesheetSubmittedEmail,
  sendTimesheetApprovedEmail,
  sendTimesheetRejectedEmail,
  sendTimesheetSubmissionConfirmationEmail,
  sendTimesheetApprovedWithAmountEmail
} from '../services/timesheetEmailService.js';
import { createAutomobInvoice, createClientInvoice } from '../services/invoiceService.js';
import { createNotification } from '../utils/notificationHelper.js';

const router = express.Router();

// Get automob's accepted missions (missions where application is accepted)
router.get('/my-missions', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const [missions] = await db.query(`
      SELECT 
        m.*,
        ma.id as application_id,
        ma.status as application_status,
        ma.created_at as applied_at,
        COALESCE(mab.status, m.status) as mission_status_for_automob,
        mab.completed_at,
        cp.company_name as client_company,
        cp.first_name as client_first_name,
        cp.last_name as client_last_name,
        cp.phone as client_phone,
        s.nom as secteur_name,
        (SELECT COUNT(*) FROM timesheets WHERE mission_id = m.id AND automob_id = ?) as timesheet_count,
        (SELECT COALESCE(SUM(total_hours), 0) FROM timesheets WHERE mission_id = m.id AND automob_id = ? AND status = 'approuve') as approved_hours,
        (SELECT COALESCE(SUM(overtime_hours), 0) FROM timesheets WHERE mission_id = m.id AND automob_id = ? AND status = 'approuve') as approved_overtime_hours,
        (SELECT COALESCE(SUM(total_hours), 0) FROM timesheets WHERE mission_id = m.id AND automob_id = ? AND status = 'soumis') as pending_hours,
        (SELECT COALESCE(SUM(overtime_hours), 0) FROM timesheets WHERE mission_id = m.id AND automob_id = ? AND status = 'soumis') as pending_overtime_hours,
        (SELECT COALESCE(SUM(total_hours), 0) FROM timesheets WHERE mission_id = m.id AND automob_id = ? AND status IN ('brouillon', 'soumis', 'approuve')) as recorded_hours,
        (SELECT id FROM timesheets WHERE mission_id = m.id AND automob_id = ? AND status = 'brouillon' ORDER BY created_at DESC LIMIT 1) as draft_timesheet_id
      FROM missions m
      JOIN mission_applications ma ON m.id = ma.mission_id
      LEFT JOIN mission_automobs mab ON m.id = mab.mission_id AND mab.automob_id = ma.automob_id
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      LEFT JOIN secteurs s ON m.secteur_id = s.id
      WHERE ma.automob_id = ?
      ORDER BY 
        CASE COALESCE(mab.status, m.status)
          WHEN 'en_cours' THEN 1
          WHEN 'ouvert' THEN 2
          WHEN 'termine' THEN 3
          WHEN 'annule' THEN 4
        END,
        CASE ma.status
          WHEN 'accepte' THEN 1
          WHEN 'en_attente' THEN 2
          WHEN 'refuse' THEN 3
        END,
        ma.created_at DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

    // Utiliser mission_status_for_automob comme statut principal
    const missionsWithCorrectStatus = missions.map(mission => ({
      ...mission,
      status: mission.mission_status_for_automob || mission.status
    }));

    res.json(missionsWithCorrectStatus);
  } catch (error) {
    console.error('Get my missions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get timesheets for a mission
router.get('/mission/:missionId', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const [timesheets] = await db.query(`
      SELECT 
        ts.*,
        (SELECT COUNT(*) FROM timesheet_entries WHERE timesheet_id = ts.id) as entry_count,
        u.email as reviewed_by_email
      FROM timesheets ts
      LEFT JOIN users u ON ts.reviewed_by = u.id
      WHERE ts.mission_id = ? AND ts.automob_id = ?
      ORDER BY ts.period_start DESC
    `, [req.params.missionId, req.user.id]);

    res.json(timesheets);
  } catch (error) {
    console.error('Get timesheets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create a new timesheet
router.post('/create', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  const { mission_id, period_type, period_start, period_end } = req.body;

  try {
    // Verify mission access
    const [applications] = await db.query(
      'SELECT * FROM mission_applications WHERE mission_id = ? AND automob_id = ? AND status = "accepte"',
      [mission_id, req.user.id]
    );

    if (applications.length === 0) {
      return res.status(403).json({ error: 'Accès non autorisé à cette mission' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check for existing draft timesheet first with lock
      const [existingDraft] = await connection.query(`
        SELECT id FROM timesheets 
        WHERE mission_id = ? AND automob_id = ? AND status = 'brouillon'
        FOR UPDATE
      `, [mission_id, req.user.id]);

      if (existingDraft.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(200).json({
          message: 'Brouillon existant trouvé',
          timesheetId: existingDraft[0].id,
          existing: true
        });
      }

      // Check for overlapping timesheets (including submitted/approved)
      const [existing] = await connection.query(`
        SELECT id FROM timesheets 
        WHERE mission_id = ? AND automob_id = ?
        AND (
          (period_start <= ? AND period_end >= ?)
          OR (period_start <= ? AND period_end >= ?)
          OR (period_start >= ? AND period_end <= ?)
        )
        FOR UPDATE
      `, [mission_id, req.user.id, period_start, period_start, period_end, period_end, period_start, period_end]);

      if (existing.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Une feuille de temps existe déjà pour cette période' });
      }

      const [result] = await connection.query(
        'INSERT INTO timesheets (mission_id, automob_id, period_type, period_start, period_end) VALUES (?, ?, ?, ?, ?)',
        [mission_id, req.user.id, period_type, period_start, period_end]
      );

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: 'Feuille de temps créée',
        timesheetId: result.insertId
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Create timesheet error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get timesheet details with entries
router.get('/:timesheetId', authenticateToken, async (req, res) => {
  try {
    const [timesheets] = await db.query(`
      SELECT 
        ts.*,
        m.mission_name,
        m.title,
        m.hourly_rate,
        m.billing_frequency,
        m.max_hours,
        m.total_hours as mission_total_hours,
        cp.company_name as client_company
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      WHERE ts.id = ? AND ts.automob_id = ?
    `, [req.params.timesheetId, req.user.id]);

    if (timesheets.length === 0) {
      return res.status(404).json({ error: 'Feuille de temps non trouvée' });
    }

    const [entries] = await db.query(
      'SELECT * FROM timesheet_entries WHERE timesheet_id = ? ORDER BY work_date ASC',
      [req.params.timesheetId]
    );

    res.json({
      ...timesheets[0],
      entries
    });
  } catch (error) {
    console.error('Get timesheet details error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Add entry to timesheet
router.post('/:timesheetId/entries', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  const { work_date, start_time, end_time, break_duration, notes, is_overtime } = req.body;

  try {
    // Verify timesheet ownership and status
    const [timesheets] = await db.query(
      'SELECT * FROM timesheets WHERE id = ? AND automob_id = ? AND status = "brouillon"',
      [req.params.timesheetId, req.user.id]
    );

    if (timesheets.length === 0) {
      return res.status(403).json({ error: 'Impossible de modifier cette feuille de temps' });
    }

    // Convert date to MySQL format (YYYY-MM-DD)
    const formattedDate = new Date(work_date).toISOString().split('T')[0];

    // Calculate hours worked
    const start = new Date(`2000-01-01 ${start_time}`);
    const end = new Date(`2000-01-01 ${end_time}`);
    let hours = (end - start) / (1000 * 60 * 60);
    // Convert break_duration from minutes to hours
    const breakHours = (parseFloat(break_duration) || 0) / 60;
    hours -= breakHours;

    if (hours <= 0) {
      return res.status(400).json({ error: 'Heures de travail invalides' });
    }

    const [result] = await db.query(
      `INSERT INTO timesheet_entries 
       (timesheet_id, work_date, start_time, end_time, break_duration, hours_worked, is_overtime, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.timesheetId, formattedDate, start_time, end_time, break_duration || 0, hours, is_overtime || false, notes]
    );

    // Update total hours and calculate overtime hours properly
    // Get mission hours for proper overtime calculation
    const [missionInfo] = await db.query(`
      SELECT m.max_hours, m.total_hours as mission_total_hours, m.billing_frequency
      FROM missions m 
      JOIN timesheets ts ON m.id = ts.mission_id 
      WHERE ts.id = ?
    `, [req.params.timesheetId]);

    const missionHours = missionInfo[0]?.max_hours || missionInfo[0]?.mission_total_hours || 0;

    await db.query(
      `UPDATE timesheets SET 
       total_hours = (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?),
       overtime_hours = GREATEST(0, 
         (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?) - ?
       )
       WHERE id = ?`,
      [req.params.timesheetId, req.params.timesheetId, missionHours, req.params.timesheetId]
    );

    res.status(201).json({
      message: 'Entrée ajoutée',
      entryId: result.insertId,
      hours_worked: hours
    });
  } catch (error) {
    console.error('Add entry error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update entry
router.put('/entries/:entryId', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  const { work_date, start_time, end_time, break_duration, notes, is_overtime } = req.body;

  try {
    // Verify ownership through timesheet
    const [entries] = await db.query(`
      SELECT te.*, ts.automob_id, ts.status
      FROM timesheet_entries te
      JOIN timesheets ts ON te.timesheet_id = ts.id
      WHERE te.id = ?
    `, [req.params.entryId]);

    if (entries.length === 0 || entries[0].automob_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (entries[0].status !== 'brouillon') {
      return res.status(403).json({ error: 'Impossible de modifier une feuille de temps soumise' });
    }

    // Convert date to MySQL format (YYYY-MM-DD)
    const formattedDate = new Date(work_date).toISOString().split('T')[0];

    // Calculate hours
    const start = new Date(`2000-01-01 ${start_time}`);
    const end = new Date(`2000-01-01 ${end_time}`);
    let hours = (end - start) / (1000 * 60 * 60);
    // Convert break_duration from minutes to hours
    const breakHours = (parseFloat(break_duration) || 0) / 60;
    hours -= breakHours;

    await db.query(
      `UPDATE timesheet_entries 
       SET work_date = ?, start_time = ?, end_time = ?, break_duration = ?, hours_worked = ?, is_overtime = ?, notes = ?
       WHERE id = ?`,
      [formattedDate, start_time, end_time, break_duration || 0, hours, is_overtime || false, notes, req.params.entryId]
    );

    // Update total hours and calculate overtime hours properly
    const timesheetId = entries[0].timesheet_id;

    // Get mission hours for proper overtime calculation
    const [missionInfo] = await db.query(`
      SELECT m.max_hours, m.total_hours as mission_total_hours, m.billing_frequency
      FROM missions m 
      JOIN timesheets ts ON m.id = ts.mission_id 
      WHERE ts.id = ?
    `, [timesheetId]);

    const missionHours = missionInfo[0]?.max_hours || missionInfo[0]?.mission_total_hours || 0;

    await db.query(
      `UPDATE timesheets SET 
       total_hours = (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?),
       overtime_hours = GREATEST(0, 
         (SELECT SUM(hours_worked) FROM timesheet_entries WHERE timesheet_id = ?) - ?
       )
       WHERE id = ?`,
      [timesheetId, timesheetId, missionHours, timesheetId]
    );

    res.json({ message: 'Entrée mise à jour' });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete entry
router.delete('/entries/:entryId', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const [entries] = await db.query(`
      SELECT te.*, ts.automob_id, ts.status, ts.id as timesheet_id
      FROM timesheet_entries te
      JOIN timesheets ts ON te.timesheet_id = ts.id
      WHERE te.id = ?
    `, [req.params.entryId]);

    if (entries.length === 0 || entries[0].automob_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (entries[0].status !== 'brouillon') {
      return res.status(403).json({ error: 'Impossible de supprimer une entrée d\'une feuille soumise' });
    }

    await db.query('DELETE FROM timesheet_entries WHERE id = ?', [req.params.entryId]);

    // Update total hours
    await db.query(
      'UPDATE timesheets SET total_hours = (SELECT COALESCE(SUM(hours_worked), 0) FROM timesheet_entries WHERE timesheet_id = ?) WHERE id = ?',
      [entries[0].timesheet_id, entries[0].timesheet_id]
    );

    res.json({ message: 'Entrée supprimée' });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Submit timesheet for approval
router.post('/:timesheetId/submit', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const [timesheets] = await db.query(
      'SELECT * FROM timesheets WHERE id = ? AND automob_id = ? AND status = "brouillon"',
      [req.params.timesheetId, req.user.id]
    );

    if (timesheets.length === 0) {
      return res.status(403).json({ error: 'Feuille de temps non trouvée ou déjà soumise' });
    }

    // Check if there are entries
    const [entries] = await db.query(
      'SELECT COUNT(*) as count FROM timesheet_entries WHERE timesheet_id = ?',
      [req.params.timesheetId]
    );

    if (entries[0].count === 0) {
      return res.status(400).json({ error: 'Ajoutez au moins une entrée avant de soumettre' });
    }

    await db.query(
      'UPDATE timesheets SET status = "soumis", submitted_at = NOW() WHERE id = ?',
      [req.params.timesheetId]
    );

    // Notify client and automob
    const timesheet = timesheets[0];
    const [missions] = await db.query('SELECT client_id, mission_name FROM missions WHERE id = ?', [timesheet.mission_id]);

    if (missions.length > 0) {
      // Créer la notification pour le client avec Web Push
      await createNotification(
        missions[0].client_id,
        '⏰ Feuille de temps à approuver',
        `Nouvelle feuille de temps pour "${missions[0].mission_name}" - ${timesheet.total_hours}h`,
        'warning',
        'mission',
        `/client/timesheet/${req.params.timesheetId}`
      );

      // Créer la notification pour l'automob avec Web Push
      await createNotification(
        req.user.id,
        '📤 Feuille de temps envoyée',
        `Votre feuille de temps pour "${missions[0].mission_name}" a été envoyée au client - En attente d'approbation`,
        'info',
        'mission',
        `/automob/my-missions`
      );

      // Récupérer les infos pour les emails
      const [clientInfo] = await db.query('SELECT email FROM users WHERE id = ?', [missions[0].client_id]);
      const [automobInfo] = await db.query('SELECT first_name, last_name, user_id FROM automob_profiles WHERE user_id = ?', [req.user.id]);
      const [automobEmail] = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);

      if (clientInfo.length > 0 && automobInfo.length > 0) {
        const automobName = `${automobInfo[0].first_name} ${automobInfo[0].last_name}`;

        // Envoyer l'email au client
        try {
          await sendTimesheetSubmittedEmail(clientInfo[0].email, {
            automobName,
            missionName: missions[0].mission_name,
            totalHours: timesheet.total_hours,
            overtimeHours: timesheet.overtime_hours || 0,
            timesheetId: req.params.timesheetId
          });
        } catch (emailError) {
          console.error('Erreur envoi email client:', emailError);
        }

        // Envoyer l'email de confirmation à l'automob
        if (automobEmail.length > 0) {
          try {
            await sendTimesheetSubmissionConfirmationEmail(automobEmail[0].email, {
              missionName: missions[0].mission_name,
              totalHours: timesheet.total_hours,
              overtimeHours: timesheet.overtime_hours || 0
            });
          } catch (emailError) {
            console.error('Erreur envoi email automob:', emailError);
          }
        }
      }
    }

    res.json({ message: 'Feuille de temps soumise pour approbation' });
  } catch (error) {
    console.error('Submit timesheet error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Client: Get timesheets to review
router.get('/client/pending', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    const [timesheets] = await db.query(`
      SELECT 
        ts.*,
        m.mission_name,
        m.title,
        m.hourly_rate,
        ap.first_name as automob_first_name,
        ap.last_name as automob_last_name,
        (SELECT COUNT(*) FROM timesheet_entries WHERE timesheet_id = ts.id) as entry_count
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id
      JOIN automob_profiles ap ON ts.automob_id = ap.user_id
      WHERE m.client_id = ? AND ts.status = 'soumis'
      ORDER BY ts.submitted_at DESC
    `, [req.user.id]);

    res.json(timesheets);
  } catch (error) {
    console.error('Get pending timesheets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Client: Approve timesheet
router.patch('/:timesheetId/approve', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    // First check if timesheet exists regardless of status
    const [allTimesheets] = await db.query(`
      SELECT ts.*, m.client_id, m.id as mission_id, m.mission_name, m.total_hours as mission_total_hours
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id
      WHERE ts.id = ?
    `, [req.params.timesheetId]);

    if (allTimesheets.length === 0) {
      return res.status(404).json({ error: 'Feuille de temps non trouvée' });
    }

    // Check if already approved
    if (allTimesheets[0].status === 'approuve') {
      return res.status(400).json({
        error: 'Cette feuille de temps est déjà approuvée',
        alreadyApproved: true
      });
    }

    // Check if not submitted yet
    if (allTimesheets[0].status !== 'soumis') {
      return res.status(400).json({
        error: `Impossible d'approuver une feuille de temps avec le statut '${allTimesheets[0].status}'`,
        currentStatus: allTimesheets[0].status
      });
    }

    const timesheets = allTimesheets;

    if (timesheets[0].client_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const timesheet = timesheets[0];

    await db.query(
      'UPDATE timesheets SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['approuve', req.user.id, req.params.timesheetId]
    );

    // Vérifier s'il reste des timesheets non approuvés pour cet automob sur cette mission
    const [pendingCheck] = await db.query(`
      SELECT COUNT(*) as pending_count
      FROM timesheets 
      WHERE mission_id = ? AND automob_id = ? AND status IN ('brouillon', 'soumis')
    `, [timesheet.mission_id, timesheet.automob_id]);

    const hasPendingTimesheets = pendingCheck[0].pending_count > 0;

    // Si tous les timesheets sont approuvés (aucun en attente), marquer la mission comme terminée pour cet automob
    if (!hasPendingTimesheets) {
      console.log(`✅ Tous les timesheets approuvés pour automob ${timesheet.automob_id} sur mission ${timesheet.mission_id}`);

      // Vérifier si mission_automobs existe, sinon le créer
      const [missionAutomobs] = await db.query(
        'SELECT id FROM mission_automobs WHERE mission_id = ? AND automob_id = ?',
        [timesheet.mission_id, timesheet.automob_id]
      );

      if (missionAutomobs.length === 0) {
        console.log(`📝 Création de mission_automobs pour automob ${timesheet.automob_id} sur mission ${timesheet.mission_id}`);
        await db.query(
          'INSERT INTO mission_automobs (mission_id, automob_id, status, created_at) VALUES (?, ?, "termine", NOW())',
          [timesheet.mission_id, timesheet.automob_id]
        );
      } else {
        await db.query(
          'UPDATE mission_automobs SET status = "termine", completed_at = NOW() WHERE mission_id = ? AND automob_id = ?',
          [timesheet.mission_id, timesheet.automob_id]
        );
      }

      // Les factures sont générées lors de la finalisation de la mission (complete-automob)
      // pour éviter des doublons et des crédits wallet multiples.
      console.log(`✅ Timesheet ${req.params.timesheetId} approuvé. Les factures seront générées à la fin de la mission.`);

      // Récupérer les infos pour les notifications finales
      const [automobInfo] = await db.query(
        'SELECT first_name, last_name FROM automob_profiles WHERE user_id = ?',
        [timesheet.automob_id]
      );
      const [clientEmailRows] = await db.query('SELECT email FROM users WHERE id = ?', [timesheet.client_id]);
      const automobName = automobInfo[0] ? `${automobInfo[0].first_name} ${automobInfo[0].last_name}` : 'L\'Automob';
      const clientEmail = clientEmailRows[0]?.email;

      // Notifier l'Automob que sa mission est terminée
      await createNotification(
        timesheet.automob_id,
        '🎉 Mission terminée',
        `Félicitations ! Toutes vos heures pour "${timesheet.mission_name}" ont été approuvées. La mission est maintenant terminée.`,
        'success',
        'mission',
        `/automob/invoices`,
        req.app.get('io')
      );

      // Notifier le Client que la mission est terminée
      await createNotification(
        timesheet.client_id,
        '✅ Mission terminée',
        `La mission "${timesheet.mission_name}" avec ${automobName} est désormais terminée. Toutes les heures ont été validées.`,
        'success',
        'mission',
        `/client/invoices`,
        req.app.get('io')
      );

      // Envoyer emails de fin de mission
      if (clientEmail) {
        const { sendNotificationEmail } = await import('../services/emailService.js');
        const clientCompletionMsg = `La mission "${timesheet.mission_name}" effectuée par ${automobName} est terminée. Vous pouvez retrouver les factures dans votre espace client.`;
        sendNotificationEmail(clientEmail, '✅ Mission terminée', clientCompletionMsg, `${process.env.FRONTEND_URL}/client/invoices`)
          .catch(err => console.error('Erreur email complétion client:', err));
      }
    } else {
      // Calculer le montant gagné pour cette feuille de temps
      const [missionDetails] = await db.query(
        'SELECT hourly_rate FROM missions WHERE id = ?',
        [timesheet.mission_id]
      );

      const hourlyRate = parseFloat(missionDetails[0]?.hourly_rate || 0);
      const amount = (parseFloat(timesheet.total_hours) * hourlyRate).toFixed(2);

      // Notification standard d'approbation avec montant et Web Push
      await createNotification(
        timesheet.automob_id,
        '✅ Feuille de temps approuvée',
        `Votre feuille de temps a été approuvée - ${timesheet.total_hours}h = ${amount}€`,
        'success',
        'payment',
        `/automob/wallet`
      );

      // Envoyer email avec le montant
      const [automobEmail] = await db.query('SELECT email FROM users WHERE id = ?', [timesheet.automob_id]);
      if (automobEmail.length > 0) {
        try {
          await sendTimesheetApprovedWithAmountEmail(automobEmail[0].email, {
            missionName: timesheet.mission_name,
            totalHours: timesheet.total_hours,
            amount: amount,
            timesheetId: req.params.timesheetId
          });
        } catch (emailError) {
          console.error('Erreur envoi email approbation:', emailError);
        }
      }
    }

    res.json({
      message: 'Feuille de temps approuvée',
      missionCompleted: !hasPendingTimesheets  // Si plus de timesheets en attente, mission complétée
    });
  } catch (error) {
    console.error('Approve timesheet error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Client: Reject timesheet
router.patch('/:timesheetId/reject', authenticateToken, authorizeRoles('client'), async (req, res) => {
  const { reason } = req.body;

  try {
    const [timesheets] = await db.query(`
      SELECT ts.*, m.client_id, m.mission_name
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id
      WHERE ts.id = ? AND ts.status = 'soumis'
    `, [req.params.timesheetId]);

    if (timesheets.length === 0) {
      return res.status(404).json({ error: 'Feuille de temps non trouvée' });
    }

    if (timesheets[0].client_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const timesheet = timesheets[0];

    // Marquer comme rejetée et remettre en brouillon pour permettre la modification
    await db.query(
      'UPDATE timesheets SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?',
      ['brouillon', req.user.id, reason || null, req.params.timesheetId]
    );

    // Notify automob avec Web Push
    await createNotification(
      timesheet.automob_id,
      '❌ Feuille de temps refusée',
      `Votre feuille de temps pour "${timesheet.mission_name}" a été refusée. ${reason ? 'Raison: ' + reason : 'Veuillez la corriger et la soumettre à nouveau.'}`,
      'error',
      'mission',
      `/automob/timesheet/${req.params.timesheetId}`
    );

    // Envoyer email de refus
    const [automobEmail] = await db.query('SELECT email FROM users WHERE id = ?', [timesheet.automob_id]);
    if (automobEmail.length > 0) {
      try {
        await sendTimesheetRejectedEmail(automobEmail[0].email, {
          missionName: timesheet.mission_name,
          totalHours: timesheet.total_hours,
          rejectionReason: reason || 'Aucune raison spécifiée',
          timesheetId: req.params.timesheetId
        });
      } catch (emailError) {
        console.error('Erreur envoi email refus:', emailError);
      }
    }

    res.json({ message: 'Feuille de temps refusée' });
  } catch (error) {
    console.error('Reject timesheet error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all timesheets for client (all missions)
router.get('/client/all', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    const [timesheets] = await db.query(`
      SELECT 
        ts.*,
        m.mission_name,
        m.title,
        m.hourly_rate,
        ap.first_name as automob_first_name,
        ap.last_name as automob_last_name
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id
      LEFT JOIN automob_profiles ap ON ts.automob_id = ap.user_id
      WHERE m.client_id = ?
      ORDER BY 
        CASE ts.status
          WHEN 'soumis' THEN 1
          WHEN 'approuve' THEN 2
          WHEN 'rejete' THEN 3
          WHEN 'brouillon' THEN 4
        END,
        ts.submitted_at DESC,
        ts.created_at DESC
    `, [req.user.id]);

    res.json(timesheets);
  } catch (error) {
    console.error('Get all client timesheets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get timesheet details for client
router.get('/client/:timesheetId', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    const [timesheets] = await db.query(`
      SELECT 
        ts.*,
        m.mission_name,
        m.title,
        m.hourly_rate,
        m.client_id,
        ap.first_name as automob_first_name,
        ap.last_name as automob_last_name,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id
      LEFT JOIN automob_profiles ap ON ts.automob_id = ap.user_id
      WHERE ts.id = ? AND m.client_id = ?
    `, [req.params.timesheetId, req.user.id]);

    if (timesheets.length === 0) {
      return res.status(404).json({ error: 'Feuille de temps non trouvée' });
    }

    const [entries] = await db.query(
      'SELECT * FROM timesheet_entries WHERE timesheet_id = ? ORDER BY work_date ASC',
      [req.params.timesheetId]
    );

    res.json({
      ...timesheets[0],
      entries
    });
  } catch (error) {
    console.error('Get timesheet details (client) error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all timesheets for a mission (for client)
router.get('/mission/:missionId/all', authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const [missions] = await db.query('SELECT client_id FROM missions WHERE id = ?', [req.params.missionId]);

    if (missions.length === 0) {
      return res.status(404).json({ error: 'Mission non trouvée' });
    }

    // Autoriser client ou automob de la mission
    const isClient = missions[0].client_id === req.user.id;
    const [isAutomob] = await db.query(
      'SELECT 1 FROM mission_applications WHERE mission_id = ? AND automob_id = ? AND status = "accepte"',
      [req.params.missionId, req.user.id]
    );

    if (!isClient && isAutomob.length === 0) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const [timesheets] = await db.query(`
      SELECT 
        ts.*,
        ap.first_name as automob_first_name,
        ap.last_name as automob_last_name,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
        (SELECT COUNT(*) FROM timesheet_entries WHERE timesheet_id = ts.id) as entry_count
      FROM timesheets ts
      LEFT JOIN automob_profiles ap ON ts.automob_id = ap.user_id
      WHERE ts.mission_id = ? AND ts.status != 'brouillon'
      ORDER BY ts.submitted_at DESC
    `, [req.params.missionId]);

    res.json(timesheets);
  } catch (error) {
    console.error('Get mission timesheets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

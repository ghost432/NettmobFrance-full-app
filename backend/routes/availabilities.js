import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all availabilities for current user
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'automob') {
    return res.status(403).json({ error: 'Accès réservé aux auto-entrepreneurs' });
  }

  try {
    const [availabilities] = await db.query(
      'SELECT * FROM automob_availabilities WHERE user_id = ? ORDER BY start_date DESC',
      [req.user.id]
    );
    res.json({ availabilities });
  } catch (error) {
    console.error('Erreur récupération disponibilités:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create new availability
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'automob') {
    return res.status(403).json({ error: 'Accès réservé aux auto-entrepreneurs' });
  }

  const { start_date, end_date, notes } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Les dates de début et fin sont requises' });
  }

  // Validate dates
  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ error: 'La date de début doit être antérieure à la date de fin' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO automob_availabilities (user_id, start_date, end_date, notes) VALUES (?, ?, ?, ?)',
      [req.user.id, start_date, end_date, notes || null]
    );

    const [[availability]] = await db.query(
      'SELECT * FROM automob_availabilities WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ availability });
  } catch (error) {
    console.error('Erreur création disponibilité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update availability
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'automob') {
    return res.status(403).json({ error: 'Accès réservé aux auto-entrepreneurs' });
  }

  const { id } = req.params;
  const { start_date, end_date, notes } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Les dates de début et fin sont requises' });
  }

  // Validate dates
  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ error: 'La date de début doit être antérieure à la date de fin' });
  }

  try {
    // Check ownership
    const [[existing]] = await db.query(
      'SELECT * FROM automob_availabilities WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Disponibilité non trouvée' });
    }

    await db.query(
      'UPDATE automob_availabilities SET start_date = ?, end_date = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [start_date, end_date, notes || null, id]
    );

    const [[availability]] = await db.query(
      'SELECT * FROM automob_availabilities WHERE id = ?',
      [id]
    );

    res.json({ availability });
  } catch (error) {
    console.error('Erreur mise à jour disponibilité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete availability
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'automob') {
    return res.status(403).json({ error: 'Accès réservé aux auto-entrepreneurs' });
  }

  const { id } = req.params;

  try {
    // Check ownership
    const [[existing]] = await db.query(
      'SELECT * FROM automob_availabilities WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Disponibilité non trouvée' });
    }

    await db.query('DELETE FROM automob_availabilities WHERE id = ?', [id]);
    res.json({ message: 'Disponibilité supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression disponibilité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

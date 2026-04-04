const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ============================================
// BILLING FREQUENCIES (Fréquences de facturation)
// ============================================

// GET - Liste des fréquences de facturation
router.get('/billing-frequencies', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [frequencies] = await db.query(
      'SELECT * FROM billing_frequencies WHERE active = 1 ORDER BY id ASC'
    );
    res.json({ frequencies });
  } catch (error) {
    console.error('❌ Erreur récupération fréquences:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer une fréquence de facturation
router.post('/billing-frequencies', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { value, label } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Valeur et libellé requis' });
    }

    // Vérifier si la valeur existe déjà
    const [existing] = await db.query(
      'SELECT id FROM billing_frequencies WHERE value = ?',
      [value]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cette valeur existe déjà' });
    }

    const [result] = await db.query(
      'INSERT INTO billing_frequencies (value, label) VALUES (?, ?)',
      [value, label]
    );

    res.status(201).json({
      message: 'Fréquence créée avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Erreur création fréquence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT - Modifier une fréquence de facturation
router.put('/billing-frequencies/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Valeur et libellé requis' });
    }

    // Vérifier si la valeur existe déjà pour un autre ID
    const [existing] = await db.query(
      'SELECT id FROM billing_frequencies WHERE value = ? AND id != ?',
      [value, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cette valeur existe déjà' });
    }

    await db.query(
      'UPDATE billing_frequencies SET value = ?, label = ? WHERE id = ?',
      [value, label, id]
    );

    res.json({ message: 'Fréquence modifiée avec succès' });
  } catch (error) {
    console.error('❌ Erreur modification fréquence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE - Supprimer une fréquence de facturation
router.delete('/billing-frequencies/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la fréquence est utilisée dans des missions
    const [missions] = await db.query(
      'SELECT COUNT(*) as count FROM missions WHERE billing_frequency = (SELECT value FROM billing_frequencies WHERE id = ?)',
      [id]
    );

    if (missions[0].count > 0) {
      return res.status(400).json({ 
        error: `Cette fréquence est utilisée par ${missions[0].count} mission(s). Impossible de la supprimer.` 
      });
    }

    await db.query('DELETE FROM billing_frequencies WHERE id = ?', [id]);
    res.json({ message: 'Fréquence supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression fréquence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// LOCATION TYPES (Types de lieux)
// ============================================

// GET - Liste des types de lieux
router.get('/location-types', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [locationTypes] = await db.query(
      'SELECT * FROM location_types WHERE active = 1 ORDER BY id ASC'
    );
    res.json({ locationTypes });
  } catch (error) {
    console.error('❌ Erreur récupération types de lieux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer un type de lieu
router.post('/location-types', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { value, label } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Valeur et libellé requis' });
    }

    // Vérifier si la valeur existe déjà
    const [existing] = await db.query(
      'SELECT id FROM location_types WHERE value = ?',
      [value]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cette valeur existe déjà' });
    }

    const [result] = await db.query(
      'INSERT INTO location_types (value, label) VALUES (?, ?)',
      [value, label]
    );

    res.status(201).json({
      message: 'Type de lieu créé avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Erreur création type de lieu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT - Modifier un type de lieu
router.put('/location-types/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Valeur et libellé requis' });
    }

    // Vérifier si la valeur existe déjà pour un autre ID
    const [existing] = await db.query(
      'SELECT id FROM location_types WHERE value = ? AND id != ?',
      [value, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cette valeur existe déjà' });
    }

    await db.query(
      'UPDATE location_types SET value = ?, label = ? WHERE id = ?',
      [value, label, id]
    );

    res.json({ message: 'Type de lieu modifié avec succès' });
  } catch (error) {
    console.error('❌ Erreur modification type de lieu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un type de lieu
router.delete('/location-types/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le type de lieu est utilisé dans des missions
    const [missions] = await db.query(
      'SELECT COUNT(*) as count FROM missions WHERE location_type = (SELECT value FROM location_types WHERE id = ?)',
      [id]
    );

    if (missions[0].count > 0) {
      return res.status(400).json({ 
        error: `Ce type de lieu est utilisé par ${missions[0].count} mission(s). Impossible de le supprimer.` 
      });
    }

    await db.query('DELETE FROM location_types WHERE id = ?', [id]);
    res.json({ message: 'Type de lieu supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression type de lieu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// HOURLY RATES (Tarifs horaires)
// ============================================

// GET - Liste des tarifs horaires
router.get('/hourly-rates', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rates] = await db.query(
      'SELECT * FROM hourly_rates WHERE active = 1 ORDER BY rate ASC'
    );
    res.json({ rates });
  } catch (error) {
    console.error('❌ Erreur récupération tarifs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer un tarif horaire
router.post('/hourly-rates', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { rate, label, description } = req.body;

    if (!rate || !label) {
      return res.status(400).json({ error: 'Tarif et libellé requis' });
    }

    const [result] = await db.query(
      'INSERT INTO hourly_rates (rate, label, description) VALUES (?, ?, ?)',
      [rate, label, description || null]
    );

    res.status(201).json({
      message: 'Tarif créé avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Erreur création tarif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT - Modifier un tarif horaire
router.put('/hourly-rates/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rate, label, description } = req.body;

    if (!rate || !label) {
      return res.status(400).json({ error: 'Tarif et libellé requis' });
    }

    await db.query(
      'UPDATE hourly_rates SET rate = ?, label = ?, description = ? WHERE id = ?',
      [rate, label, description || null, id]
    );

    res.json({ message: 'Tarif modifié avec succès' });
  } catch (error) {
    console.error('❌ Erreur modification tarif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un tarif horaire
router.delete('/hourly-rates/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM hourly_rates WHERE id = ?', [id]);
    res.json({ message: 'Tarif supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression tarif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

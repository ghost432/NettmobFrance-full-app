import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all active secteurs
router.get('/', async (req, res) => {
  try {
    const [secteurs] = await db.query(
      'SELECT * FROM secteurs WHERE active = TRUE ORDER BY nom'
    );
    res.json(secteurs);
  } catch (error) {
    console.error('Erreur récupération secteurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get secteur by ID
router.get('/:id', async (req, res) => {
  try {
    const [secteurs] = await db.query(
      'SELECT * FROM secteurs WHERE id = ?',
      [req.params.id]
    );
    
    if (secteurs.length === 0) {
      return res.status(404).json({ error: 'Secteur non trouvé' });
    }
    
    res.json(secteurs[0]);
  } catch (error) {
    console.error('Erreur récupération secteur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Create secteur
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { nom, description } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO secteurs (nom, description) VALUES (?, ?)',
      [nom, description]
    );
    
    res.status(201).json({
      id: result.insertId,
      nom,
      description,
      active: true
    });
  } catch (error) {
    console.error('Erreur création secteur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Update secteur
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { nom, description, active } = req.body;

  try {
    await db.query(
      'UPDATE secteurs SET nom = ?, description = ?, active = ? WHERE id = ?',
      [nom, description, active, req.params.id]
    );
    
    res.json({ message: 'Secteur mis à jour' });
  } catch (error) {
    console.error('Erreur mise à jour secteur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Delete secteur
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    await db.query('DELETE FROM secteurs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Secteur supprimé' });
  } catch (error) {
    console.error('Erreur suppression secteur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

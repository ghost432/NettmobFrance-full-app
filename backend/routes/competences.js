import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all active competences
router.get('/', async (req, res) => {
  try {
    const [competences] = await db.query(
      'SELECT * FROM competences WHERE active = TRUE ORDER BY secteur_id, nom'
    );
    res.json(competences);
  } catch (error) {
    console.error('Erreur récupération compétences:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get competences by secteur
router.get('/secteur/:secteurId', async (req, res) => {
  try {
    const [competences] = await db.query(
      'SELECT * FROM competences WHERE secteur_id = ? AND active = TRUE ORDER BY nom',
      [req.params.secteurId]
    );
    res.json(competences);
  } catch (error) {
    console.error('Erreur récupération compétences:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get competence by ID
router.get('/:id', async (req, res) => {
  try {
    const [competences] = await db.query(
      'SELECT * FROM competences WHERE id = ?',
      [req.params.id]
    );
    
    if (competences.length === 0) {
      return res.status(404).json({ error: 'Compétence non trouvée' });
    }
    
    res.json(competences[0]);
  } catch (error) {
    console.error('Erreur récupération compétence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Create competence
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { secteur_id, nom, description } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO competences (secteur_id, nom, description) VALUES (?, ?, ?)',
      [secteur_id, nom, description]
    );
    
    res.status(201).json({
      id: result.insertId,
      secteur_id,
      nom,
      description,
      active: true
    });
  } catch (error) {
    console.error('Erreur création compétence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Update competence
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { secteur_id, nom, description, active } = req.body;

  try {
    await db.query(
      'UPDATE competences SET secteur_id = ?, nom = ?, description = ?, active = ? WHERE id = ?',
      [secteur_id, nom, description, active, req.params.id]
    );
    
    res.json({ message: 'Compétence mise à jour' });
  } catch (error) {
    console.error('Erreur mise à jour compétence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Delete competence
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    await db.query('DELETE FROM competences WHERE id = ?', [req.params.id]);
    res.json({ message: 'Compétence supprimée' });
  } catch (error) {
    console.error('Erreur suppression compétence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

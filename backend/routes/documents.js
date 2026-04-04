
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuration du stockage pour les documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé. Formats acceptés: JPEG, PNG, PDF, DOC, DOCX'));
    }
  }
});

// Récupérer tous les documents de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [documents] = await db.query(
      'SELECT * FROM automob_documents WHERE user_id = ? ORDER BY uploaded_at DESC',
      [req.user.id]
    );
    res.json({ documents });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un document
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { name, type, has_expiry } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Le nom du document est requis' });
    }

    const filePath = `/uploads/documents/${req.file.filename}`;
    
    const [result] = await db.query(
      'INSERT INTO automob_documents (user_id, name, type, has_expiry, file_path) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, type || 'document', has_expiry === 'true' || has_expiry === true, filePath]
    );

    const [newDocument] = await db.query(
      'SELECT * FROM automob_documents WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Document ajouté avec succès',
      document: newDocument[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du document:', error);
    // Supprimer le fichier si l'insertion en base a échoué
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/documents', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ error: 'Erreur lors de l\'ajout du document' });
  }
});

// Supprimer un document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const documentId = req.params.id;
    
    // Vérifier que le document appartient à l'utilisateur
    const [document] = await db.query(
      'SELECT * FROM automob_documents WHERE id = ? AND user_id = ?',
      [documentId, req.user.id]
    );

    if (document.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '..', document[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer l'entrée en base
    await db.query('DELETE FROM automob_documents WHERE id = ?', [documentId]);

    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du document' });
  }
});

export default router;

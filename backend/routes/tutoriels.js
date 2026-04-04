import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../config/database.js';
import { authenticateToken, adminRequired } from '../middleware/auth.js';

const router = express.Router();

// Répertoire upload vidéos
const uploadDir = './uploads/tutoriels';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `tuto_${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Format vidéo non supporté'));
    }
});

/**
 * GET /api/tutoriels
 * Public — liste des tutoriels avec filtre type + pagination
 */
router.get('/', async (req, res) => {
    try {
        const { type, page = 1, limit = 12 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let where = '';
        const params = [];
        if (type) {
            where = 'WHERE type = ?';
            params.push(type);
        }

        const [rows] = await db.query(
            `SELECT * FROM tutoriels ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM tutoriels ${where}`,
            params
        );

        res.json({ tutoriels: rows, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        console.error('Erreur GET tutoriels:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/tutoriels — Admin : publier un tutoriel
 */
router.post('/', authenticateToken, adminRequired, upload.single('video'), async (req, res) => {
    try {
        const { titre, type } = req.body;
        if (!titre || !type || !req.file) {
            return res.status(400).json({ error: 'Titre, type et vidéo sont requis' });
        }
        const videoUrl = `/uploads/tutoriels/${req.file.filename}`;
        const [result] = await db.query(
            'INSERT INTO tutoriels (titre, video_url, type) VALUES (?, ?, ?)',
            [titre, videoUrl, type]
        );
        res.status(201).json({ success: true, id: result.insertId, videoUrl });
    } catch (err) {
        console.error('Erreur POST tutoriel:', err);
        res.status(500).json({ error: 'Erreur lors de la publication' });
    }
});

/**
 * PUT /api/tutoriels/:id — Admin : modifier titre/type
 */
router.put('/:id', authenticateToken, adminRequired, async (req, res) => {
    try {
        const { titre, type } = req.body;
        await db.query('UPDATE tutoriels SET titre = ?, type = ? WHERE id = ?', [titre, type, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/tutoriels/:id — Admin : supprimer
 */
router.delete('/:id', authenticateToken, adminRequired, async (req, res) => {
    try {
        const [[tuto]] = await db.query('SELECT video_url FROM tutoriels WHERE id = ?', [req.params.id]);
        if (!tuto) return res.status(404).json({ error: 'Tutoriel introuvable' });

        // Supprimer le fichier vidéo du disque
        const filePath = '.' + tuto.video_url;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await db.query('DELETE FROM tutoriels WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Erreur DELETE tutoriel:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../config/database.js';
import { adminRequired } from '../middleware/auth.js';

const router = express.Router();

// ─── Slugify helper ───────────────────────────────────────────────────────────
const slugify = (text) => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')   // strip accents
        .replace(/[^a-z0-9\s-]/g, '')     // only alphanumeric
        .trim()
        .replace(/\s+/g, '-')             // spaces → dashes
        .replace(/-+/g, '-')              // collapse multiple dashes
        .slice(0, 70);                    // max 70 chars (≈8 words)
};

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/blog';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = /jpeg|jpg|png|webp|avif/.test(file.mimetype) &&
            /jpeg|jpg|png|webp|avif/.test(path.extname(file.originalname).toLowerCase());
        ok ? cb(null, true) : cb(new Error('Format non supporté (JPG, PNG, WEBP, AVIF)'));
    }
});

// ─── GET all ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { type, limit } = req.query;
        let query = 'SELECT * FROM blog_posts';
        const params = [];
        if (type) { query += ' WHERE type = ?'; params.push(type); }
        query += ' ORDER BY created_at DESC';
        if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
        const [posts] = await db.query(query, params);
        res.json(posts);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─── GET by slug OR id ────────────────────────────────────────────────────────
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const isNumeric = /^\d+$/.test(identifier);
        const [post] = isNumeric
            ? await db.query('SELECT * FROM blog_posts WHERE id = ?', [identifier])
            : await db.query('SELECT * FROM blog_posts WHERE slug = ?', [identifier]);
        if (post.length === 0) return res.status(404).json({ error: 'Article non trouvé' });
        res.json(post[0]);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─── Vote helpful (public) ────────────────────────────────────────────────────
router.post('/:identifier/vote', async (req, res) => {
    try {
        const { vote } = req.body;
        if (!['yes', 'no'].includes(vote)) return res.status(400).json({ error: 'Vote invalide' });
        const { identifier } = req.params;
        const isNumeric = /^\d+$/.test(identifier);
        const col = vote === 'yes' ? 'helpful_yes' : 'helpful_no';
        const where = isNumeric ? 'id = ?' : 'slug = ?';
        await db.query(`UPDATE blog_posts SET ${col} = ${col} + 1 WHERE ${where}`, [identifier]);
        const [[post]] = await db.query(`SELECT helpful_yes, helpful_no FROM blog_posts WHERE ${where}`, [identifier]);
        res.json({ success: true, helpful_yes: post.helpful_yes, helpful_no: post.helpful_no });
    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─── Create (Admin) ───────────────────────────────────────────────────────────
router.post('/', adminRequired, upload.single('image'), async (req, res) => {
    try {
        const { title, type, excerpt, content } = req.body;
        const image_url = req.file ? `/uploads/blog/${req.file.filename}` : (req.body.image_url || null);
        if (!title || !type || !content) return res.status(400).json({ error: 'Titre, type et contenu requis' });

        // Generate unique slug
        let baseSlug = slugify(title);
        let slug = baseSlug;
        let counter = 1;
        while (true) {
            const [existing] = await db.query('SELECT id FROM blog_posts WHERE slug = ?', [slug]);
            if (existing.length === 0) break;
            slug = `${baseSlug}-${counter++}`;
        }

        const [result] = await db.query(
            'INSERT INTO blog_posts (title, slug, type, excerpt, content, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [title, slug, type, excerpt, content, image_url]
        );
        res.status(201).json({ id: result.insertId, slug, message: 'Article créé avec succès' });
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
    }
});

// ─── Update (Admin) ───────────────────────────────────────────────────────────
router.put('/:id', adminRequired, upload.single('image'), async (req, res) => {
    try {
        const { title, type, excerpt, content } = req.body;
        const postId = req.params.id;
        const [existing] = await db.query('SELECT * FROM blog_posts WHERE id = ?', [postId]);
        if (existing.length === 0) return res.status(404).json({ error: 'Article non trouvé' });

        // Update slug if title changed
        let slug = existing[0].slug || slugify(existing[0].title);
        if (title !== existing[0].title) {
            let baseSlug = slugify(title);
            slug = baseSlug;
            let counter = 1;
            while (true) {
                const [dup] = await db.query('SELECT id FROM blog_posts WHERE slug = ? AND id != ?', [slug, postId]);
                if (dup.length === 0) break;
                slug = `${baseSlug}-${counter++}`;
            }
        }

        let image_url = existing[0].image_url;
        if (req.file) {
            image_url = `/uploads/blog/${req.file.filename}`;
            if (existing[0].image_url?.startsWith('/uploads/blog/')) {
                const oldPath = path.join(process.cwd(), existing[0].image_url.slice(1));
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        } else if (req.body.image_url) {
            image_url = req.body.image_url;
        }

        await db.query(
            'UPDATE blog_posts SET title = ?, slug = ?, type = ?, excerpt = ?, content = ?, image_url = ? WHERE id = ?',
            [title, slug, type, excerpt, content, image_url, postId]
        );
        res.json({ slug, message: 'Article mis à jour avec succès' });
    } catch (error) {
        console.error('Error updating blog post:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});

// ─── Delete (Admin) ───────────────────────────────────────────────────────────
router.delete('/:id', adminRequired, async (req, res) => {
    try {
        const [existing] = await db.query('SELECT image_url FROM blog_posts WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Article non trouvé' });
        if (existing[0].image_url?.startsWith('/uploads/blog/')) {
            const filePath = path.join(process.cwd(), existing[0].image_url.slice(1));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.query('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Article supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;

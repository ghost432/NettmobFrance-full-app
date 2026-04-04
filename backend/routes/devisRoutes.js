import express from 'express';
import devisController from '../controllers/devisController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public route to submit a devis
router.post('/', devisController.createDevis);

// Admin routes
router.get('/', authenticateToken, authorizeRoles('admin'), devisController.getAllDevis);
router.get('/:id', authenticateToken, authorizeRoles('admin'), devisController.getDevisById);
router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), devisController.updateDevisStatus);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), devisController.deleteDevis);

export default router;

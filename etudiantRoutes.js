import express from 'express';
import { getMonDashboard } from '../controllers/etudiantController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Cette route nécessite obligatoirement un token valide !
router.get('/mon-dashboard', verifyToken, getMonDashboard);

export default router;
import express from 'express';
import { getMesMatieres, getSuiviEtudiants } from '../controllers/enseignantController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/mes-matieres', verifyToken, getMesMatieres);
router.get('/suivi', verifyToken, getSuiviEtudiants);

export default router;
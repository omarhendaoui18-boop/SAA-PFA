import express from 'express';
import { getMatieres } from '../controllers/matiereController.js';

const router = express.Router();
router.get('/', getMatieres);

export default router;
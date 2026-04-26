import express from 'express';
import { addNote, getNotesByEtudiant } from '../controllers/noteController.js';

const router = express.Router();

router.post('/', addNote);
router.get('/etudiant/:id', getNotesByEtudiant);

export default router;
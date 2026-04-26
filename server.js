import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js'; // <-- AJOUTE ÇA
import matiereRoutes from './routes/matiereRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import etudiantRoutes from './routes/etudiantRoutes.js';
import enseignantRoutes from './routes/enseignantRoutes.js';
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => res.json({ success: true }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // <-- AJOUTE ÇA
app.use('/api/matieres', matiereRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/etudiant', etudiantRoutes);
app.use('/api/enseignant', enseignantRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
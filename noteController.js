import { pool } from '../database/connection.js';

// SAISIR UNE NOTE
export const addNote = async (req, res) => {
    try {
        const { etudiant_id, matiere_id, type_note, valeur } = req.body;

        // Vérifier que la note est entre 0 et 20
        if (valeur < 0 || valeur > 20) {
            return res.status(400).json({ success: false, message: 'La note doit être entre 0 et 20.' });
        }

        // Insérer ou Mettre à jour (grâce au UNIQUE KEY)
        await pool.query(
            `INSERT INTO notes (etudiant_id, matiere_id, type_note, valeur) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE valeur = ?`,
            [etudiant_id, matiere_id, type_note, valeur, valeur]
        );

        res.json({ success: true, message: 'Note enregistrée avec succès !' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde' });
    }
};

// RÉCUPÉRER LES NOTES D'UN ÉTUDIANT (Pour plus tard)
export const getNotesByEtudiant = async (req, res) => {
    try {
        const { id } = req.params;
        const [notes] = await pool.query(
            `SELECT n.valeur, n.type_note, m.nom as matiere_nom, m.type_evaluation, m.coefficient 
             FROM notes n 
             JOIN matieres m ON n.matiere_id = m.id 
             WHERE n.etudiant_id = ?`, [id]);
        res.json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};
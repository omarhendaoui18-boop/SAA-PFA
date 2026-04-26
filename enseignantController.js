import { pool } from '../database/connection.js';
import { calculerMoyenneMatiere, calculerMoyenneGenerale } from '../services/calculMoyenne.js';
import { getStatutAcademique } from '../services/statutAcademique.js';

// RÉCUPÉRER SEULEMENT LES MATIÈRES DE L'ENSEIGNANT CONNECTÉ
export const getMesMatieres = async (req, res) => {
    try {
        const [enseignant] = await pool.query('SELECT id FROM enseignants WHERE user_id = ?', [req.user.id]);
        
        if (enseignant.length === 0) {
            return res.json({ success: true, data: [] }); 
        }

        const ensId = enseignant[0].id;
        const [matieres] = await pool.query('SELECT * FROM matieres WHERE enseignant_id = ?', [ensId]);
        
        res.json({ success: true, data: matieres });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// SUIVI DES ÉTUDIANTS
export const getSuiviEtudiants = async (req, res) => {
    try {
        const [etudiants] = await pool.query('SELECT * FROM etudiants');
        const [notes] = await pool.query(`
            SELECT n.etudiant_id, n.matiere_id, n.valeur, n.type_note, m.nom as matiere_nom, m.coefficient, m.type_evaluation 
            FROM notes n JOIN matieres m ON n.matiere_id = m.id
        `);

        let suivi = [];
        etudiants.forEach(etu => {
            let notesEtu = notes.filter(n => n.etudiant_id === etu.id);
            if (notesEtu.length === 0) return;

            let matieresMap = {};
            notesEtu.forEach(note => {
                if (!matieresMap[note.matiere_id]) {
                    matieresMap[note.matiere_id] = { nom: note.matiere_nom, coefficient: parseFloat(note.coefficient) || 0, type_evaluation: note.type_evaluation, notes: [] };
                }
                matieresMap[note.matiere_id].notes.push({ type_note: note.type_note, valeur: parseFloat(note.valeur) || 0 });
            });

            let matieresAvecMoyenne = Object.values(matieresMap).map(mat => {
                mat.moyenne = calculerMoyenneMatiere(mat.notes, mat.type_evaluation);
                return mat;
            });

            const moyenneGenerale = calculerMoyenneGenerale(matieresAvecMoyenne);
            const statut = getStatutAcademique(moyenneGenerale);
            let matiereFaible = matieresAvecMoyenne.reduce((min, mat) => mat.moyenne < min.moyenne ? mat : min, matieresAvecMoyenne[0]);

            suivi.push({ etudiant: etu, moyenne: moyenneGenerale, statut: statut, matiereFaible: matiereFaible.nom, noteFaible: matiereFaible.moyenne });
        });

        suivi.sort((a, b) => a.moyenne - b.moyenne);
        res.json({ success: true, data: suivi });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};
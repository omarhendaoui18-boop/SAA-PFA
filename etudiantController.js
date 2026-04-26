import { pool } from '../database/connection.js';
import { calculerMoyenneMatiere, calculerMoyenneGenerale } from '../services/calculMoyenne.js';
import { getStatutAcademique } from '../services/statutAcademique.js';
import { genererRecommandation } from '../services/generateRecommandation.js';

export const getMonDashboard = async (req, res) => {
    try {
        // 1. Trouver l'étudiant lié à ce compte utilisateur (via le token décodé)
        const [etudiants] = await pool.query('SELECT * FROM etudiants WHERE user_id = ?', [req.user.id]);
        if (etudiants.length === 0) return res.status(404).json({ success: false, message: 'Profil étudiant non trouvé' });
        
        const etudiant = etudiants[0];
        const etudiantId = etudiant.id;

        // 2. Récupérer toutes ses notes avec les infos des matières
        const [notes] = await pool.query(
            `SELECT n.valeur,n.matiere_id, n.type_note, m.nom as matiere_nom, m.coefficient, m.type_evaluation 
             FROM notes n 
             JOIN matieres m ON n.matiere_id = m.id 
             WHERE n.etudiant_id = ?`, [etudiantId]);

        // 3. Grouper les notes par matière
        let matieresMap = {};
        notes.forEach(note => {
            if (!matieresMap[note.matiere_id]) {
                matieresMap[note.matiere_id] = {
                    nom: note.matiere_nom,
                    coefficient: parseFloat(note.coefficient) || 0, // FORCE LE NOMBRE
                    type_evaluation: note.type_evaluation,
                    notes: []
                };
            }
            matieresMap[note.matiere_id].notes.push({ type_note: note.type_note, valeur: parseFloat(note.valeur) || 0 });
        });

        // 4. UTILISATION DE L'IA : Calculer la moyenne par matière
        let matieresAvecMoyenne = Object.values(matieresMap).map(mat => {
            mat.moyenne = calculerMoyenneMatiere(mat.notes, mat.type_evaluation);
            return mat;
        });

        // 5. UTILISATION DE L'IA : Calculer la moyenne générale
        const moyenneGenerale = calculerMoyenneGenerale(matieresAvecMoyenne);

        // 6. UTILISATION DE L'IA : Déterminer le statut académique
        const statut = getStatutAcademique(moyenneGenerale);
         // --- AJOUTE CE BLOC POUR LES RECOMMANDATIONS ---
        let recommandations = [];
        matieresAvecMoyenne.forEach(mat => {
            if (mat.moyenne < 10) { // S'il a moins de 10 dans une matière
                const conseil = genererRecommandation(mat.nom, mat.moyenne);
                if (conseil) recommandations.push(conseil);
            }
        });





        // 7. Envoyer tout au frontend (Ajoute recommandations dans data)
        res.json({
            success: true,
            data: {
                profil: etudiant,
                matieres: matieresAvecMoyenne,
                moyenneGenerale: moyenneGenerale,
                statut: statut,
                recommandations: recommandations // <-- NOUVEAU
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};
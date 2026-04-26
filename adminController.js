import bcrypt from 'bcryptjs';
import { pool } from '../database/connection.js';
import { calculerMoyenneMatiere } from '../services/calculMoyenne.js';

// 1. AJOUTER UN ÉTUDIANT
export const addEtudiant = async (req, res) => {
    try {
        const { nom, prenom, matricule, filiere, niveau } = req.body;
        const email = `${matricule}@univ.dz`;
        const defaultPassword = 'etudiant123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const [userResult] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'etudiant']);
        const userId = userResult.insertId;

        await pool.query('INSERT INTO etudiants (user_id, nom, prenom, matricule, filiere, niveau) VALUES (?, ?, ?, ?, ?, ?)', [userId, nom, prenom, matricule, filiere, niveau]);
        res.status(201).json({ success: true, message: 'Étudiant ajouté avec succès !' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Ce matricule existe déjà !' });
        res.status(500).json({ success: false, message: "Erreur lors de l'ajout" });
    }
};

// 2. RÉCUPÉRER TOUS LES ÉTUDIANTS
export const getEtudiants = async (req, res) => {
    try {
        const [etudiants] = await pool.query('SELECT * FROM etudiants ORDER BY id DESC');
        res.json({ success: true, data: etudiants });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// STATISTIQUES GLOBALES (CORRIGÉE)
export const getAdminStats = async (req, res) => {
    try {
        const [totalRes] = await pool.query('SELECT COUNT(*) as total FROM etudiants');
        const totalEtudiants = totalRes[0].total;
        
        // On récupère le type_note pour pouvoir calculer la moyenne par matière
        const [notes] = await pool.query(`
            SELECT n.etudiant_id, n.matiere_id, n.valeur, n.type_note, m.coefficient, m.type_evaluation 
            FROM notes n JOIN matieres m ON n.matiere_id = m.id
        `);
        
        // 1. Regrouper par étudiant, puis par matière
        let etudiantsMap = {};
        notes.forEach(note => {
            if (!etudiantsMap[note.etudiant_id]) {
                etudiantsMap[note.etudiant_id] = { matieres: {} };
            }
            const matId = note.matiere_id;
            if (!etudiantsMap[note.etudiant_id].matieres[matId]) {
                etudiantsMap[note.etudiant_id].matieres[matId] = {
                    notes: [],
                    coefficient: parseFloat(note.coefficient) || 0,
                    type_evaluation: note.type_evaluation
                };
            }
            etudiantsMap[note.etudiant_id].matieres[matId].notes.push({
                type_note: note.type_note,
                valeur: parseFloat(note.valeur) || 0
            });
        });

        let danger = 0, bon = 0, sommeMoyennes = 0, nbEvalues = 0;

        // 2. Pour chaque étudiant, calculer sa moyenne exacte comme le fait l'étudiant
        for (let etuId in etudiantsMap) {
            let etuPoints = 0;
            let etuCoeffs = 0;

            for (let matId in etudiantsMap[etuId].matieres) {
                const mat = etudiantsMap[etuId].matieres[matId];
                // UTILISATION DE LA VRAIE FONCTION DE CALCUL
                const moyMat = calculerMoyenneMatiere(mat.notes, mat.type_evaluation) || 0;
                etuPoints += moyMat * mat.coefficient;
                etuCoeffs += mat.coefficient;
            }

            if (etuCoeffs > 0) {
                let moyGeneraleEtu = etuPoints / etuCoeffs;
                sommeMoyennes += moyGeneraleEtu;
                nbEvalues++;
                if (moyGeneraleEtu < 8) danger++;
                else if (moyGeneraleEtu >= 12) bon++;
            }
        }

        const moyenneGenerale = nbEvalues > 0 ? (sommeMoyennes / nbEvalues).toFixed(2) : "0.00";
        const moyen = Math.max(0, totalEtudiants - danger - bon);
        
        res.json({ success: true, data: { totalEtudiants, enDanger: danger, statutMoyen: moyen, statutBon: bon, moyenneGenerale } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur de calcul' });
    }
};
// MOYENNES PAR FILIÈRE (CORRIGÉE)
export const getStatsByFiliere = async (req, res) => {
    try {
        const [etudiants] = await pool.query('SELECT * FROM etudiants');
        const [notes] = await pool.query(`
            SELECT n.etudiant_id, n.matiere_id, n.valeur, n.type_note, m.coefficient, m.type_evaluation 
            FROM notes n JOIN matieres m ON n.matiere_id = m.id
        `);
        
        let filieresMap = {};
        etudiants.forEach(etu => {
            const filiere = etu.filiere || 'Non définie';
            if (!filieresMap[filiere]) filieresMap[filiere] = { totalPoints: 0, totalCoeff: 0 };
            
            // Regrouper les notes par matière pour cet étudiant
            let etuMatieres = {};
            notes.filter(n => n.etudiant_id === etu.id).forEach(note => {
                if (!etuMatieres[note.matiere_id]) {
                    etuMatieres[note.matiere_id] = { 
                        notes: [], 
                        coeff: parseFloat(note.coefficient)||0, 
                        evalType: note.type_evaluation 
                    };
                }
                etuMatieres[note.matiere_id].notes.push({ 
                    type_note: note.type_note, 
                    valeur: parseFloat(note.valeur)||0 
                });
            });

            // Calculer la moyenne pondérée de cet étudiant
            let etuPoints = 0;
            let etuCoeffs = 0;
            for(let matId in etuMatieres) {
                const moyMat = calculerMoyenneMatiere(etuMatieres[matId].notes, etuMatieres[matId].evalType) || 0;
                etuPoints += moyMat * etuMatieres[matId].coeff;
                etuCoeffs += etuMatieres[matId].coeff;
            }

            if (etuCoeffs > 0) {
                filieresMap[filiere].totalPoints += etuPoints;
                filieresMap[filiere].totalCoeff += etuCoeffs;
            }
        });

        let result = {};
        for (let fil in filieresMap) {
            let coeff = filieresMap[fil].totalCoeff;
            result[fil] = coeff > 0 ? parseFloat((filieresMap[fil].totalPoints / coeff).toFixed(2)) : 0;
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};
// 5. AJOUTER UN ENSEIGNANT
export const addEnseignant = async (req, res) => {
    try {
        const { nom, prenom, email, grade, specialite } = req.body;
        const defaultPassword = 'enseignant123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const [userResult] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'enseignant']);
        const userId = userResult.insertId;

        await pool.query('INSERT INTO enseignants (user_id, nom, prenom, grade, specialite) VALUES (?, ?, ?, ?, ?)', [userId, nom, prenom, grade, specialite]);
        res.status(201).json({ success: true, message: 'Enseignant ajouté avec succès !' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Cet email existe déjà !' });
        res.status(500).json({ success: false, message: "Erreur lors de l'ajout" });
    }
};

// 6. RÉCUPÉRER LES ENSEIGNANTS
export const getEnseignants = async (req, res) => {
    try {
        const [enseignants] = await pool.query('SELECT e.*, u.email FROM enseignants e JOIN users u ON e.user_id = u.id ORDER BY e.id DESC');
        res.json({ success: true, data: enseignants });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 7. RÉCUPÉRER TOUS LES UTILISATEURS
export const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, role, actif FROM users ORDER BY id DESC');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// MODIFIER UN ÉTUDIANT
export const updateEtudiant = async (req, res) => {
    try {
        const { nom, prenom, filiere, niveau } = req.body;
        const { id } = req.params;
        
        await pool.query(
            'UPDATE etudiants SET nom = ?, prenom = ?, filiere = ?, niveau = ? WHERE id = ?',
            [nom, prenom, filiere, niveau, id]
        );
        
        res.json({ success: true, message: 'Étudiant modifié avec succès !' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la modification' });
    }
};

// SUPPRIMER UN ÉTUDIANT
export const deleteEtudiant = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Récupérer le user_id lié à cet étudiant
        const [etu] = await pool.query('SELECT user_id FROM etudiants WHERE id = ?', [id]);
        
        if (etu.length > 0) {
            // Supprimer le compte utilisateur (Cela supprimera l'étudiant automatiquement grâce à ON DELETE CASCADE)
            await pool.query('DELETE FROM users WHERE id = ?', [etu[0].user_id]);
        }
        
        res.json({ success: true, message: 'Étudiant supprimé définitivement !' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
};
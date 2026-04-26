import { pool } from '../database/connection.js';

export const getMatieres = async (req, res) => {
    try {
        const [matieres] = await pool.query('SELECT * FROM matieres ORDER BY nom ASC');
        res.json({ success: true, data: matieres });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};
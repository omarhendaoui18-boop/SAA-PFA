import bcrypt from 'bcryptjs';
import { pool } from './database/connection.js';

console.log("Génération du vrai mot de passe en cours...");
const vraiHash = await bcrypt.hash('enseignant123', 10);

await pool.query(
    `UPDATE users SET password = ? WHERE email IN ('sara@univ.dz', 'ahmed@univ.dz', 'leila@univ.dz', 'karim@univ.dz')`,
    [vraiHash]
);

console.log("✅ Succès ! Les mots de passe de Sara, Ahmed, Leila et Karim ont été corrigés.");
process.exit();
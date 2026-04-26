import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Récupère le token après "Bearer "

    if (!token) {
        return res.status(401).json({ success: false, message: 'Non autorisé' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // On attache les infos de l'utilisateur à la requête
        next(); // On passe au contrôleur
    } catch (error) {
        res.status(403).json({ success: false, message: 'Token invalide' });
    }
};
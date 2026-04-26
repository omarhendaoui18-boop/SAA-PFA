const mapRecommandations = {
    'Technologie Web': 'Pratiquer des exercices sur HTML/CSS avancé et créer des mini-projets avec Node.js ou React.',
    'Algorithmique': 'Résoudre 2 à 3 problèmes algorithmiques par jour sur des plateformes comme Codewars ou LeetCode.',
    'Base de Données': 'Travailler la modélisation MCD/MLD et faire des requêtes SQL complexes (Jointures, Group By, Sous-requêtes).',
    'Réseaux': 'Utiliser des simulateurs comme Cisco Packet Tracer pour configurer des topologies réelles.',
    'Systèmes d\'exploitation': 'Pratiquer les commandes Linux/Unix de base et comprendre la gestion des processus.',
    'PFA': 'Commencer par rédiger un cahier des charges clair et valider le choix technologique avec l\'encadrant.'
};

export const genererRecommandation = (nomMatiere, moyenne) => {
    if (moyenne >= 10) return null; // Pas de recommandation si c'est bon

    // Chercher une correspondance exacte ou partielle
    for (const key in mapRecommandations) {
        if (nomMatiere.toLowerCase().includes(key.toLowerCase())) {
            return `⚠️ Faiblesse en ${nomMatiere} (Moy: ${moyenne}/20) : ${mapRecommandations[key]}`;
        }
    }
    
    return `⚠️ Faiblesse en ${nomMatiere} (Moy: ${moyenne}/20) : Revoir les fondamentaux de ce cours, consulter les TD/TP et demander de l'aide à l'enseignant.`;
};
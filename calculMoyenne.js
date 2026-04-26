export const calculerMoyenneMatiere = (notes, typeEvaluation) => {
    let moyenne = 0;
    
    // Filtrer les notes par type
    const ds = notes.find(n => n.type_note === 'DS')?.valeur || 0;
    const tp = notes.find(n => n.type_note === 'TP')?.valeur || 0;
    const exam = notes.find(n => n.type_note === 'Examen')?.valeur || 0;
    const pfa = notes.find(n => n.type_note === 'PFA')?.valeur || 0;

    switch (typeEvaluation) {
        case 'DS_EXAM_30_70':
            moyenne = (ds * 0.30) + (exam * 0.70);
            break;
        case 'DS_TP_EXAM_15_15_70':
            moyenne = (ds * 0.15) + (tp * 0.15) + (exam * 0.70);
            break;
        case 'DS_EXAM_50_50':
            moyenne = (ds * 0.50) + (exam * 0.50);
            break;
        case 'PFA':
            moyenne = pfa;
            break;
        default:
            moyenne = 0;
    }
    
    return Math.round(moyenne * 100) / 100; // Arrondir à 2 décimales
};

export const calculerMoyenneGenerale = (matieresAvecMoyenne) => {
    if (matieresAvecMoyenne.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCoefficients = 0;

    matieresAvecMoyenne.forEach(mat => {
        totalPoints += mat.moyenne * mat.coefficient;
        totalCoefficients += mat.coefficient;
    });

    return Math.round((totalPoints / totalCoefficients) * 100) / 100;
};
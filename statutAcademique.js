export const getStatutAcademique = (moyenne) => {
    if (moyenne < 8) return { label: 'En danger', color: 'danger', icon: '🔴' };
    if (moyenne >= 8 && moyenne < 12) return { label: 'Moyen', color: 'warning', icon: '🟡' };
    return { label: 'Bon', color: 'success', icon: '🟢' };
};
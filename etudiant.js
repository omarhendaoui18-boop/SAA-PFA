// Sécurité stricte
if (!localStorage.getItem('saa_token') || localStorage.getItem('saa_role') !== 'etudiant') {
    window.location.href = '/pages/login.html';
}

document.getElementById('logoutBtn').addEventListener('click', (e) => { 
    e.preventDefault(); 
    localStorage.clear(); 
    window.location.href = '/pages/login.html'; 
});

const token = localStorage.getItem('saa_token');
let donneesEtudiant = null;

// Fonction pour formuler la structure proprement
function formatStructure(type) {
    switch(type) {
        case 'DS_EXAM_30_70': return 'DS 30% - Examen 70%';
        case 'DS_TP_EXAM_15_15_70': return 'DS 15% - TP 15% - Examen 70%';
        case 'DS_EXAM_50_50': return 'DS 50% - Examen 50%';
        case 'PFA': return 'Projet PFA (100%)';
        default: return type;
    }
}

async function loadDashboard() {
    try {
        const response = await fetch('/api/etudiant/mon-dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (!result.success) {
            return alert("Erreur : " + result.message);
        }

        const data = result.data;
        donneesEtudiant = data;

        // 1. Afficher le nom
        document.getElementById('nomEtudiant').textContent = data.profil.prenom;

        // 2. Afficher la moyenne générale (protégé contre null)
        const moyGeneraleSafe = data.moyenneGenerale ?? 0;
        document.getElementById('moyGen').textContent = moyGeneraleSafe.toFixed(2) + ' / 20';

        // 3. Afficher le statut
        const statutHtml = `<span class="statut-badge statut-${data.statut.color}">${data.statut.icon} ${data.statut.label}</span>`;
        document.getElementById('statutContainer').innerHTML = statutHtml;

        // 4. Afficher les matières
        const matContainer = document.getElementById('matieresContainer');
        matContainer.innerHTML = '';

        if (data.matieres.length === 0) {
            matContainer.innerHTML = '<p style="color:var(--text-secondary)">Aucune note n\'a encore été saisie pour vous.</p>';
            return;
        }

        data.matieres.forEach(mat => {
            const moyMat = mat.moyenne ?? 0;

            let classeMoy = 'moy-mauvaise';
            if (moyMat >= 10) classeMoy = 'moy-bonne';
            else if (moyMat >= 8) classeMoy = 'moy-moyenne';

            const ordre = { 'DS': 1, 'TP': 2, 'Examen': 3, 'PFA': 4 };
            const notesTriees = [...mat.notes].sort((a, b) => (ordre[a.type_note] || 99) - (ordre[b.type_note] || 99));
            let detailsNotes = notesTriees.map(n => `<strong>${n.type_note}</strong>: ${n.valeur}/20`).join(' &nbsp;|&nbsp; ');
            let structureFormatee = formatStructure(mat.type_evaluation);

            matContainer.innerHTML += `
                <div class="matiere-card">
                    <div class="matiere-info">
                        <h3>${mat.nom} <span style="font-size:12px;color:var(--text-secondary);font-weight:normal">(Coeff ${mat.coefficient})</span></h3>
                        <div class="matiere-details" style="margin-bottom: 5px;">${detailsNotes}</div>
                        <div class="matiere-details" style="font-size: 11px; color: #6c63ff;"><i class="fas fa-info-circle"></i> Structure: ${structureFormatee}</div>
                    </div>
                    <div class="matiere-moyenne ${classeMoy}">${moyMat.toFixed(2)}</div>
                </div>
            `;
        });

        // 5. Afficher les recommandations
        const recoSection = document.getElementById('recoSection');
        const recoContainer = document.getElementById('recoContainer');
        recoContainer.innerHTML = '';

        if (data.recommandations.length > 0) {
            recoSection.style.display = 'block';
            data.recommandations.forEach(conseil => {
                recoContainer.innerHTML += `
                    <div class="reco-card">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${conseil}</span>
                    </div>
                `;
            });
        } else {
            recoSection.style.display = 'block';
            recoContainer.innerHTML = `<div class="reco-card" style="border-color: rgba(40,167,69,0.3); background: rgba(40,167,69,0.05);"><i class="fas fa-check-circle" style="color: #28a745;"></i> <span>Félicitations, vous n'avez pas de recommandations pour le moment. Continuez ainsi !</span></div>`;
        }

    } catch (error) {
        document.getElementById('matieresContainer').innerHTML = `<p style="color:red; font-size: 16px;">ERREUR DÉTAILLÉE : ${error.message}</p>`;
    }
}

loadDashboard();

// --- GENERATION DU PDF ---
function genererPDF() {
    if (!donneesEtudiant) return alert("Chargement des données en cours...");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(108, 99, 255);
    doc.text("Smart Academic Assistant", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Relevé de Notes Officiel", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Nom complet : ${donneesEtudiant.profil.nom} ${donneesEtudiant.profil.prenom}`, 20, 45);
    doc.text(`Matricule : ${donneesEtudiant.profil.matricule}`, 20, 53);
    doc.text(`Filière : ${donneesEtudiant.profil.filiere || 'Non définie'}`, 20, 61);

    doc.setFontSize(14);
    doc.setTextColor(40, 167, 69);
    const moyGen = donneesEtudiant.moyenneGenerale ?? 0;
    doc.text(`Moyenne Générale : ${moyGen.toFixed(2)} / 20`, 20, 75);
    
    doc.setTextColor(0, 0, 0);
    doc.text(`Statut Académique : ${donneesEtudiant.statut.icon} ${donneesEtudiant.statut.label}`, 20, 83);

    const tableauMatieres = donneesEtudiant.matieres.map(mat => {
        const moyMat = mat.moyenne ?? 0;
        return [
            mat.nom,
            mat.coefficient.toString(),
            formatStructure(mat.type_evaluation), 
            moyMat.toFixed(2) + ' / 20',
            moyMat >= 10 ? 'Validé' : 'Non validé'
        ];
    });

    doc.autoTable({
        startY: 90,
        head: [['Matière', 'Coeff', 'Structure', 'Moyenne', 'Résultat']],
        body: tableauMatieres,
        theme: 'grid',
        headStyles: { fillColor: [108, 99, 255], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 255] }
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Document généré automatiquement par le système SAA.", 105, finalY, { align: "center" });
    doc.text(`Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`, 105, finalY + 7, { align: "center" });

    doc.save(`Releve_Notes_${donneesEtudiant.profil.matricule}.pdf`);
}

// Sécurité
if (!localStorage.getItem('saa_token') || localStorage.getItem('saa_role') !== 'enseignant') {
    window.location.href = '/pages/login.html';
}

document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); localStorage.clear(); window.location.href = '/pages/login.html'; });

const etudiantSelect = document.getElementById('etudiantSelect');
const matiereSelect = document.getElementById('matiereSelect');
const typeNoteSelect = document.getElementById('typeNoteSelect');
const valeurNote = document.getElementById('valeurNote');
const submitBtn = document.getElementById('submitBtn');
const evalTypeInfo = document.getElementById('evalTypeInfo');

let matieresData = [];

async function loadEtudiants() {
    const res = await fetch('/api/admin/etudiants');
    const data = await res.json();
    if (data.success) {
        data.data.forEach(etu => {
            etudiantSelect.innerHTML += `<option value="${etu.id}">${etu.matricule} - ${etu.nom} ${etu.prenom}</option>`;
        });
    }
}

async function loadMatieres() {
    const token = localStorage.getItem('saa_token');
    try {
        const res = await fetch('/api/enseignant/mes-matieres', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            matieresData = data.data;
            matiereSelect.innerHTML = ''; 
            if (matieresData.length === 0) {
                matiereSelect.innerHTML = '<option value="">Aucune matière assignée</option>';
                return;
            }
            data.data.forEach(mat => {
                matiereSelect.innerHTML += `<option value="${mat.id}">${mat.nom} (Coeff: ${mat.coefficient})</option>`;
            });
        }
    } catch (error) {
        matiereSelect.innerHTML = '<option value="">Erreur</option>';
    }
}

matiereSelect.addEventListener('change', (e) => {
// Fonction globale appelée directement par le HTML (Infaillible contre le cache !)
function updateTypeNote(matId) {
    const typeNoteSelect = document.getElementById('typeNoteSelect');
    const evalTypeInfo = document.getElementById('evalTypeInfo');
    
    typeNoteSelect.innerHTML = '';
    evalTypeInfo.style.display = 'none';

    if (!matId) return;

    const matiere = matieresData.find(m => m.id == matId);
    if (!matiere) return;

    const evalType = matiere.type_evaluation;
    
    evalTypeInfo.textContent = `Structure: ${evalType}`;
    evalTypeInfo.style.display = 'inline-block';

    switch (evalType) {
        case 'DS_EXAM_30_70':
        case 'DS_EXAM_50_50':
            typeNoteSelect.innerHTML = `<option value="DS">Devoir Surveillé (DS)</option><option value="Examen">Examen</option>`;
            break;
        case 'DS_TP_EXAM_15_15_70':
            typeNoteSelect.innerHTML = `<option value="DS">DS (15%)</option><option value="TP">TP (15%)</option><option value="Examen">Examen (70%)</option>`;
            break;
        case 'PFA':
            typeNoteSelect.innerHTML = `<option value="PFA">Note PFA</option>`;
            break;
    }
}
});

document.getElementById('noteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('noteMessage');
    msgDiv.textContent = '';

    const noteData = {
        etudiant_id: etudiantSelect.value,
        matiere_id: matiereSelect.value,
        type_note: typeNoteSelect.value,
        valeur: parseFloat(valeurNote.value)
    };

    const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
    });

    const result = await res.json();
    if (result.success) {
        msgDiv.innerHTML = `<span class="success"><i class="fas fa-check-circle"></i> ${result.message}</span>`;
        valeurNote.value = '';
    } else {
        msgDiv.innerHTML = `<span class="error"><i class="fas fa-times-circle"></i> ${result.message}</span>`;
    }
});

loadEtudiants();
loadMatieres();
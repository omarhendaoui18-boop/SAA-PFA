// Sécurité
if (!localStorage.getItem('saa_token') || localStorage.getItem('saa_role') !== 'admin') {
    window.location.href = '/pages/login.html';
}

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = '/pages/login.html';
});

// --- GESTION DU MODAL ---
const modal = document.getElementById('modal');
document.getElementById('openModalBtn').addEventListener('click', () => modal.classList.add('active'));
document.getElementById('closeModalBtn').addEventListener('click', () => modal.classList.remove('active'));

// --- AJOUTER UN ÉTUDIANT ---
document.getElementById('addEtudiantForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = '';
    
    const data = {
        matricule: document.getElementById('matricule').value,
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        filiere: document.getElementById('filiere').value,
        niveau: document.getElementById('niveau').value
    };

    const response = await fetch('/api/admin/etudiants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
        formMessage.innerHTML = '<span class="success">Étudiant ajouté !</span>';
        document.getElementById('addEtudiantForm').reset();
        setTimeout(() => {
            modal.classList.remove('active');
            fetchEtudiants(); // Rafraîchir le tableau
        }, 1000);
    } else {
        formMessage.innerHTML = `<span class="error">${result.message}</span>`;
    }
});

// --- AFFICHER LES ÉTUDIANTS ---
async function fetchEtudiants() {
    const response = await fetch('/api/admin/etudiants');
    const result = await response.json();
    
    const tbody = document.getElementById('etudiantsTableBody');
    tbody.innerHTML = '';
    
    if (result.success) {
        document.getElementById('countEtudiants').textContent = result.data.length;
        
        result.data.forEach(etu => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${etu.matricule}</strong></td>
                    <td>${etu.nom} ${etu.prenom}</td>
                    <td>${etu.filiere}</td>
                    <td>${etu.niveau}</td>
                    <td><span style="color: #28a745;">Actif</span></td>
                </tr>
            `;
        });
    }
}

// Charger les étudiants au démarrage de la page
fetchEtudiants();
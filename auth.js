// Elements du DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const submitBtn = document.getElementById('submitBtn');
const togglePassword = document.getElementById('togglePassword');

// Toggle Password Visibility
togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.querySelector('i').classList.toggle('fa-eye');
    togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // UI Loading state
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    errorMessage.textContent = '';

    const loginData = {
        email: emailInput.value,
        password: passwordInput.value
    };

    try {
        // Appel à l'API (à connecter au backend dans la prochaine étape)
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (data.success) {
            // Stocker le token
            localStorage.setItem('saa_token', data.token);
            localStorage.setItem('saa_role', data.user.role);
            
            // Redirection selon le rôle
            switch(data.user.role) {
                case 'admin': window.location.href = '/pages/admin-dashboard.html'; break;
                case 'enseignant': window.location.href = '/pages/enseignant-dashboard.html'; break;
                case 'etudiant': window.location.href = '/pages/etudiant-dashboard.html'; break;
            }
        } else {
            errorMessage.textContent = data.message || 'Erreur de connexion';
        }
    } catch (error) {
        errorMessage.textContent = 'Impossible de contacter le serveur. Vérifiez que le backend est lancé.';
    } finally {
        // Reset UI state
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = '<span>Se Connecter</span> <i class="fas fa-arrow-right"></i>';
    }
});
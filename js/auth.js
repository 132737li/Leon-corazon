/* =====================================================
   Berlly Boutique - Authentification (connectée à l'API)
   Les comptes et mots de passe sont gérés par le serveur :
   ce fichier n'enregistre plus aucun mot de passe dans le navigateur.
   ===================================================== */

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" fill="#f3d3de"/>' +
  '<circle cx="32" cy="24" r="12" fill="#c2185b"/>' +
  '<path d="M8 64c0-14 11-24 24-24s24 10 24 24z" fill="#c2185b"/></svg>'
);

// Nom d'utilisateur : 3 à 30 caractères, en minuscules (même règle que le serveur)
const USERNAME_REGEX = /^[a-z0-9][a-z0-9._-]{2,29}$/;

// Photo choisie sur la page profil (null = inchangée, '' = supprimée, 'data:...' = nouvelle)
let pendingPhoto = null;

/* =====================================================
   UTILITAIRES
   ===================================================== */

function setBusy(form, busy) {
  const button = form && form.querySelector('button[type="submit"]');
  if (button) button.disabled = busy;
}

/* =====================================================
   AFFICHER / CACHER MOT DE PASSE
   ===================================================== */

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (button) button.textContent = '🙈';
  } else {
    input.type = 'password';
    if (button) button.textContent = '👁';
  }
}

/* =====================================================
   GÉNÉRATEUR DE MOT DE PASSE (aléatoire sécurisé)
   ===================================================== */

function generatePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
    'abcdefghijklmnopqrstuvwxyz' +
    '0123456789' +
    '!@#$%^&*()_+-=[]{}';

  const random = new Uint32Array(16);
  crypto.getRandomValues(random);

  let password = '';
  for (let i = 0; i < random.length; i++) {
    password += characters[random[i] % characters.length];
  }

  input.value = password;
  input.type = 'text';
  checkPasswordStrength(input);

  setTimeout(() => {
    input.type = 'password';
  }, 3000);
}

/* =====================================================
   FORCE DU MOT DE PASSE
   ===================================================== */

function checkPasswordStrength(input) {
  if (!input) return;

  const password = input.value || '';
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let bar = null;
  let text = null;

  if (input.id === 'register-password') {
    bar = document.getElementById('strength-bar');
    text = document.getElementById('strength-text');
  } else if (input.id === 'reset-password') {
    bar = document.getElementById('reset-strength-bar');
    text = document.getElementById('reset-strength-text');
  }

  if (!bar || !text) return;

  if (password.length === 0) {
    bar.style.width = '0%';
    bar.style.background = '';
    text.textContent = 'Force du mot de passe';
  } else if (score <= 2) {
    bar.style.width = '30%';
    bar.style.background = '#e74c3c';
    text.textContent = 'Mot de passe faible';
  } else if (score <= 4) {
    bar.style.width = '65%';
    bar.style.background = '#f1c40f';
    text.textContent = 'Mot de passe moyen';
  } else {
    bar.style.width = '100%';
    bar.style.background = '#2ecc71';
    text.textContent = 'Mot de passe fort 🔐';
  }
}

/* =====================================================
   INSCRIPTION
   ===================================================== */

async function handleRegister(event) {
  if (event && event.preventDefault) event.preventDefault();

  const nameEl = document.getElementById('register-name');
  const usernameEl = document.getElementById('register-username');
  const emailEl = document.getElementById('register-email');
  const phoneEl = document.getElementById('register-phone');
  const passwordEl = document.getElementById('register-password');
  const confirmEl = document.getElementById('register-confirm');
  const message = document.getElementById('register-message');

  if (!usernameEl || !emailEl || !passwordEl || !confirmEl || !message) return;

  const name = (nameEl ? nameEl.value.trim() : '');
  const username = (usernameEl.value || '').trim().toLowerCase();
  const email = (emailEl.value || '').trim().toLowerCase();
  const phone = (phoneEl ? phoneEl.value.trim() : '');
  const password = passwordEl.value || '';
  const confirm = confirmEl.value || '';

  message.textContent = '';

  if (!USERNAME_REGEX.test(username)) {
    message.textContent = "Nom d'utilisateur invalide : 3 à 30 caractères (lettres, chiffres, point, tiret ou underscore).";
    usernameEl.focus();
    return;
  }

  if (!email) {
    message.textContent = 'Veuillez saisir une adresse e-mail.';
    emailEl.focus();
    return;
  }

  if (password !== confirm) {
    message.textContent = 'Les mots de passe ne correspondent pas.';
    return;
  }

  if (password.length < 8) {
    message.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
    return;
  }

  const form = event && event.target;
  setBusy(form, true);
  message.textContent = 'Création du compte...';

  try {
    await API.register({ name, username, email, phone, password });
    message.textContent = 'Compte créé avec succès !';
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (e) {
    message.textContent = e.message;
    setBusy(form, false);
  }
}

/* =====================================================
   CONNEXION
   ===================================================== */

async function handleLogin(event) {
  if (event && event.preventDefault) event.preventDefault();

  const usernameEl = document.getElementById('login-username');
  const passwordEl = document.getElementById('login-password');
  const message = document.getElementById('login-message');

  if (!usernameEl || !passwordEl || !message) return;

  const username = (usernameEl.value || '').trim().toLowerCase();
  const password = passwordEl.value || '';

  message.textContent = '';

  if (!username || !password) {
    message.textContent = "Veuillez saisir votre nom d'utilisateur et votre mot de passe.";
    return;
  }

  const form = event && event.target;
  setBusy(form, true);
  message.textContent = 'Connexion...';

  try {
    await API.login(username, password);
    message.textContent = 'Connexion réussie !';
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 700);
  } catch (e) {
    message.textContent = e.message;
    setBusy(form, false);
  }
}

/* =====================================================
   MOT DE PASSE OUBLIÉ
   ===================================================== */

async function handleForgotPassword(event) {
  if (event && event.preventDefault) event.preventDefault();

  const emailEl = document.getElementById('forgot-email');
  const message = document.getElementById('forgot-message');

  if (!emailEl || !message) return;

  const email = (emailEl.value || '').trim().toLowerCase();
  message.textContent = '';

  if (!email) {
    message.textContent = 'Veuillez saisir votre adresse e-mail.';
    emailEl.focus();
    return;
  }

  const form = event && event.target;
  setBusy(form, true);
  message.textContent = 'Envoi en cours...';

  try {
    const result = await API.forgotPassword(email);
    message.textContent = result.message;
  } catch (e) {
    message.textContent = e.message;
  }

  setBusy(form, false);
}

/* =====================================================
   NOUVEAU MOT DE PASSE (lien reçu par e-mail : ?token=...)
   ===================================================== */

async function handleResetPassword(event) {
  if (event && event.preventDefault) event.preventDefault();

  const passwordEl = document.getElementById('reset-password');
  const confirmEl = document.getElementById('reset-confirm');
  const message = document.getElementById('reset-message');

  if (!passwordEl || !confirmEl || !message) return;

  const password = passwordEl.value || '';
  const confirm = confirmEl.value || '';
  const token = new URLSearchParams(window.location.search).get('token');

  message.textContent = '';

  if (!token) {
    message.textContent = "Lien invalide. Refaites une demande depuis « Mot de passe oublié ».";
    return;
  }

  if (password.length < 8) {
    message.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
    return;
  }

  if (password !== confirm) {
    message.textContent = 'Les mots de passe ne correspondent pas.';
    return;
  }

  const form = event && event.target;
  setBusy(form, true);

  try {
    await API.resetPassword(token, password);
    message.textContent = 'Mot de passe modifié avec succès !';
    setTimeout(() => {
      window.location.href = 'connexion.html';
    }, 1200);
  } catch (e) {
    message.textContent = e.message;
    setBusy(form, false);
  }
}

/* =====================================================
   PROFIL
   ===================================================== */

function fillProfile(user) {
  const username = document.getElementById('profile-username');
  const name = document.getElementById('profile-name');
  const email = document.getElementById('profile-email');
  const phone = document.getElementById('profile-phone');
  const preview = document.getElementById('profile-preview');

  if (username) username.value = user.username || '';
  if (name) name.value = user.name || '';
  if (email) email.value = user.email || '';
  if (phone) phone.value = user.phone || '';
  if (preview && pendingPhoto === null) preview.src = user.photo || DEFAULT_AVATAR;
}

async function loadProfile() {
  const cached = API.getUser();

  if (!cached) {
    window.location.href = 'connexion.html';
    return;
  }

  fillProfile(cached);

  // Version à jour depuis le serveur (déconnecte automatiquement si la session a expiré)
  try {
    fillProfile(await API.refreshUser());
  } catch (e) {
    if (e.status === 401) window.location.href = 'connexion.html';
  }
}

/* =====================================================
   PHOTO DE PROFIL (redimensionnée en 256x256 avant l'envoi)
   ===================================================== */

function resizeImageToDataUrl(file, size) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error('Image invalide.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        // Recadrage centré (carré) pour un rendu rond propre
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;

        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

async function handlePhotoSelected(event) {
  const input = event.target;
  const file = input.files && input.files[0];
  const message = document.getElementById('profile-message');
  const preview = document.getElementById('profile-preview');

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    if (message) message.textContent = 'Veuillez choisir une image (JPG, PNG ou WebP).';
    input.value = '';
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    if (message) message.textContent = 'Image trop lourde (8 Mo maximum).';
    input.value = '';
    return;
  }

  try {
    pendingPhoto = await resizeImageToDataUrl(file, 256);
    if (preview) preview.src = pendingPhoto;
    if (message) message.textContent = 'Photo prête. Cliquez sur « Enregistrer » pour confirmer.';
  } catch (e) {
    console.error(e);
    if (message) message.textContent = 'Impossible de lire cette image.';
  }

  input.value = '';
}

function handlePhotoRemove() {
  const preview = document.getElementById('profile-preview');
  const message = document.getElementById('profile-message');

  pendingPhoto = '';
  if (preview) preview.src = DEFAULT_AVATAR;
  if (message) message.textContent = 'Photo supprimée. Cliquez sur « Enregistrer » pour confirmer.';
}

/* =====================================================
   MODIFICATION DU PROFIL
   ===================================================== */

async function handleProfileUpdate(event) {
  if (event && event.preventDefault) event.preventDefault();

  const message = document.getElementById('profile-message');
  if (!message) return;

  if (!API.isLoggedIn()) {
    window.location.href = 'connexion.html';
    return;
  }

  // L'e-mail n'est volontairement PAS envoyé : il est non modifiable (le serveur le refuse aussi).
  const fields = {
    name: document.getElementById('profile-name')?.value.trim() || '',
    phone: document.getElementById('profile-phone')?.value.trim() || '',
  };
  if (pendingPhoto !== null) fields.photo = pendingPhoto;

  const form = event && event.target;
  setBusy(form, true);
  message.textContent = 'Enregistrement...';

  try {
    await API.updateProfile(fields);
    pendingPhoto = null;
    message.textContent = 'Profil mis à jour avec succès !';
  } catch (e) {
    message.textContent = e.message;
    if (e.status === 401) setTimeout(() => { window.location.href = 'connexion.html'; }, 1200);
  }

  setBusy(form, false);
}

/* =====================================================
   DÉCONNEXION
   ===================================================== */

function logout() {
  API.logout();
  window.location.href = 'connexion.html';
}

/* =====================================================
   INITIALISATION
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) forgotForm.addEventListener('submit', handleForgotPassword);

  const resetForm = document.getElementById('reset-form');
  if (resetForm) resetForm.addEventListener('submit', handleResetPassword);

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    loadProfile();
    profileForm.addEventListener('submit', handleProfileUpdate);

    const photoInput = document.getElementById('profile-photo');
    if (photoInput) photoInput.addEventListener('change', handlePhotoSelected);

    const photoRemove = document.getElementById('profile-photo-remove');
    if (photoRemove) photoRemove.addEventListener('click', handlePhotoRemove);

    const profileLogout = document.getElementById('profile-logout');
    if (profileLogout) profileLogout.addEventListener('click', logout);
  }

  const registerPassword = document.getElementById('register-password');
  if (registerPassword) registerPassword.addEventListener('input', () => checkPasswordStrength(registerPassword));

  const resetPassword = document.getElementById('reset-password');
  if (resetPassword) resetPassword.addEventListener('input', () => checkPasswordStrength(resetPassword));
});

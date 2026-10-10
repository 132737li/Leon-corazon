/* =====================================================
   Berlly Boutique - Header : visiteur / utilisateur connecté
   - Visiteur : liens Inscription + Connexion visibles
   - Connecté : bouton Profil (photo + prénom) avec menu
                (Modifier le profil, Mes commandes, Se déconnecter)
   Lit le même utilisateur que auth.js (berlly_current_user).
   ===================================================== */

(function () {
  'use strict';

  var CURRENT_USER_KEY = 'berlly_current_user';
  var TOKEN_KEY = 'berlly_token';

  var DEFAULT_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<rect width="64" height="64" fill="#f3d3de"/>' +
    '<circle cx="32" cy="24" r="12" fill="#c2185b"/>' +
    '<path d="M8 64c0-14 11-24 24-24s24 10 24 24z" fill="#c2185b"/></svg>'
  );

  // Connecté = jeton de session présent (délivré par le serveur) + profil en cache
  function getCurrentUser() {
    try {
      if (!localStorage.getItem(TOKEN_KEY)) return null;
      var raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function displayName(user) {
    if (user.name && user.name.trim()) return user.name.trim();
    return (user.email || 'Profil').split('@')[0];
  }

  function closeDropdown() {
    var btn = document.getElementById('user-btn');
    var dropdown = document.getElementById('user-dropdown');
    if (!btn || !dropdown) return;
    dropdown.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  function render() {
    var guestLinks = document.getElementById('guest-links');
    var headerAuth = document.getElementById('header-auth');
    var userMenu = document.getElementById('user-menu');
    var user = getCurrentUser();

    if (guestLinks) guestLinks.hidden = !!user;
    if (headerAuth) headerAuth.hidden = !user;
    if (userMenu) userMenu.hidden = !user;

    if (!user) {
      closeDropdown();
      return;
    }

    var name = displayName(user);
    var label = document.getElementById('user-label');
    var avatar = document.getElementById('user-avatar');
    var fullname = document.getElementById('user-fullname');
    var email = document.getElementById('user-email');

    if (label) label.textContent = name.split(' ')[0];
    if (avatar) avatar.src = user.photo || DEFAULT_AVATAR;
    if (fullname) fullname.textContent = name;
    if (email) email.textContent = user.email || '';
  }

  function logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
      console.error('Erreur lors de la déconnexion', e);
    }
    window.location.href = 'connexion.html';
  }

  document.addEventListener('DOMContentLoaded', function () {
    render();

    // Resynchronise photo/nom avec le serveur ; si la session a expiré, l'API la supprime et l'en-tête repasse en "visiteur"
    if (window.API && window.API.isLoggedIn()) {
      window.API.refreshUser().then(render).catch(function () { render(); });
    }

    var btn = document.getElementById('user-btn');
    var dropdown = document.getElementById('user-dropdown');
    var logoutBtn = document.getElementById('menu-logout');

    if (btn && dropdown) {
      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        var willOpen = dropdown.hidden;
        dropdown.hidden = !willOpen;
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });

      document.addEventListener('click', function (event) {
        if (!dropdown.hidden && !dropdown.contains(event.target)) closeDropdown();
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeDropdown();
      });
    }

    if (logoutBtn) logoutBtn.addEventListener('click', logout);
  });

  // Connexion / déconnexion / modification dans un autre onglet
  window.addEventListener('storage', function (event) {
    if (event.key === CURRENT_USER_KEY || event.key === TOKEN_KEY) render();
  });
})();

/* =====================================================
   Berlly Boutique - Client de l'API (backend)
   Toutes les communications avec le serveur passent ici.
   ===================================================== */

(function () {
  'use strict';

  /* ⚠ ÉTAPE DE DÉPLOIEMENT : remplace cette adresse par celle de ton API (Render, Railway...)
     En local (localhost / fichier ouvert directement), l'API est supposée sur http://localhost:5000 */
  var PRODUCTION_API_URL = 'https://VOTRE-API.onrender.com/api';

  var isLocal = ['localhost', '127.0.0.1', ''].indexOf(window.location.hostname) !== -1;
  var API_URL = window.BERLLY_API_URL || (isLocal ? 'http://localhost:5000/api' : PRODUCTION_API_URL);

  var TOKEN_KEY = 'berlly_token';
  var USER_KEY = 'berlly_current_user'; // copie du profil (sans mot de passe) pour l'affichage
  var ADMIN_TOKEN_KEY = 'berlly_admin_token'; // sessionStorage : disparaît à la fermeture de l'onglet

  // Anciennes versions du site : les comptes (avec mots de passe en clair) étaient dans le navigateur
  try { localStorage.removeItem('berlly_users'); } catch (e) { /* ignoré */ }

  /* ---------- Stockage ---------- */

  function read(storage, key) {
    try { return storage.getItem(key); } catch (e) { return null; }
  }
  function write(storage, key, value) {
    try { storage.setItem(key, value); } catch (e) { console.error('Stockage impossible', e); }
  }
  function remove(storage, key) {
    try { storage.removeItem(key); } catch (e) { /* ignoré */ }
  }

  function setSession(data) {
    write(localStorage, TOKEN_KEY, data.token);
    write(localStorage, USER_KEY, JSON.stringify(data.user));
  }
  function clearSession() {
    remove(localStorage, TOKEN_KEY);
    remove(localStorage, USER_KEY);
  }

  /* ---------- Requêtes ---------- */

  async function request(path, options) {
    options = options || {};
    var admin = options.admin === true;
    var token = admin ? read(sessionStorage, ADMIN_TOKEN_KEY) : read(localStorage, TOKEN_KEY);

    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;

    var response;
    try {
      response = await fetch(API_URL + path, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (e) {
      var offline = new Error('Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.');
      offline.status = 0;
      throw offline;
    }

    var data = null;
    try { data = await response.json(); } catch (e) { /* réponse sans JSON */ }

    if (!response.ok) {
      // Session expirée : on la nettoie (sauf pour une connexion, où 401 = mauvais mot de passe)
      if (response.status === 401 && token && !options.keepSession) {
        if (admin) remove(sessionStorage, ADMIN_TOKEN_KEY);
        else clearSession();
      }
      var error = new Error((data && data.message) || 'Une erreur est survenue. Réessayez.');
      error.status = response.status;
      throw error;
    }

    return data;
  }

  /* ---------- Clients ---------- */

  var API = {
    url: API_URL,

    isLoggedIn: function () { return !!read(localStorage, TOKEN_KEY); },

    getUser: function () {
      if (!read(localStorage, TOKEN_KEY)) return null;
      try { return JSON.parse(read(localStorage, USER_KEY)); } catch (e) { return null; }
    },

    register: async function (fields) {
      var data = await request('/auth/register', { method: 'POST', body: fields, keepSession: true });
      setSession(data);
      return data.user;
    },

    // Connexion : nom d'utilisateur + mot de passe (l'e-mail ne sert qu'à récupérer le mot de passe)
    login: async function (username, password) {
      var data = await request('/auth/login', { method: 'POST', body: { username: username, password: password }, keepSession: true });
      setSession(data);
      return data.user;
    },

    logout: function () { clearSession(); },

    // Resynchronise le profil avec le serveur (photo, nom...) ; déconnecte si la session a expiré
    refreshUser: async function () {
      var data = await request('/auth/me');
      write(localStorage, USER_KEY, JSON.stringify(data.user));
      return data.user;
    },

    // fields : { name, phone, photo } - l'e-mail n'est jamais envoyé (non modifiable)
    updateProfile: async function (fields) {
      var data = await request('/auth/me', { method: 'PATCH', body: fields });
      write(localStorage, USER_KEY, JSON.stringify(data.user));
      return data.user;
    },

    forgotPassword: function (email) {
      return request('/auth/forgot-password', { method: 'POST', body: { email: email }, keepSession: true });
    },

    resetPassword: function (token, password) {
      return request('/auth/reset-password', { method: 'POST', body: { token: token, password: password }, keepSession: true });
    },

    createOrder: async function (order) {
      var data = await request('/orders', { method: 'POST', body: order });
      return data.order;
    },

    myOrders: async function () {
      var data = await request('/orders/mine');
      return data.orders;
    },

    admin: {
      isLoggedIn: function () { return !!read(sessionStorage, ADMIN_TOKEN_KEY); },

      login: async function (username, password) {
        var data = await request('/admin/login', { method: 'POST', body: { username: username, password: password }, admin: true, keepSession: true });
        write(sessionStorage, ADMIN_TOKEN_KEY, data.token);
      },

      logout: function () { remove(sessionStorage, ADMIN_TOKEN_KEY); },

      orders: async function () {
        var data = await request('/admin/orders', { admin: true });
        return data.orders;
      },

      setStatus: async function (id, status) {
        var data = await request('/admin/orders/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: { status: status }, admin: true });
        return data.order;
      },

      remove: function (id) {
        return request('/admin/orders/' + encodeURIComponent(id), { method: 'DELETE', admin: true });
      },
    },
  };

  window.API = API;
})();

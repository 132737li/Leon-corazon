const rateLimit = require('express-rate-limit');
const config = require('../config');

const tooMany = { message: 'Trop de tentatives. Réessayez dans quelques minutes.' };

// Inscription, connexion, mot de passe oublié
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany,
});

// Connexion administrateur : plus strict
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Math.max(5, Math.floor(config.rateLimitMax / 2)),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany,
});

module.exports = { authLimiter, adminLimiter };

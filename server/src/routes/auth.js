const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');

const config = require('../config');
const User = require('../models/User');
const { signToken, requireUser } = require('../middleware/auth');
const { authLimiter } = require('../middleware/limiters');
const { asyncHandler } = require('../middleware/errors');
const { serializeUser } = require('../utils/serialize');
const { sendMail } = require('../utils/mailer');
const { PHONE_RE, RESERVED_USERNAMES, isString, clean, validEmail, validPassword, validPhoto, validUsername, normalizeUsername } = require('../utils/validate');

const router = express.Router();

// Sert à garder le même temps de réponse quand l'e-mail n'existe pas (anti-énumération)
const DUMMY_HASH = bcrypt.hashSync('mot-de-passe-factice', config.bcryptRounds);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const sessionFor = (user) => ({
  token: signToken({ sub: String(user._id), role: 'user' }, '7d'),
  user: serializeUser(user),
});

/* ---------- Inscription ---------- */
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { name, username, email, phone, password } = req.body || {};

  if (!validUsername(username)) {
    return res.status(400).json({ message: "Nom d'utilisateur invalide : 3 à 30 caractères (lettres, chiffres, point, tiret ou underscore)." });
  }
  const normalizedUsername = normalizeUsername(username);
  if (RESERVED_USERNAMES.includes(normalizedUsername)) {
    return res.status(400).json({ message: "Ce nom d'utilisateur n'est pas disponible." });
  }
  if (!validEmail(email)) return res.status(400).json({ message: 'Adresse e-mail invalide.' });
  if (!validPassword(password)) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir entre 8 et 72 caractères.' });
  }

  const cleanPhone = clean(phone, 30);
  if (cleanPhone && !PHONE_RE.test(cleanPhone)) {
    return res.status(400).json({ message: 'Numéro de téléphone invalide.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.findOne({ username: normalizedUsername })) {
    return res.status(409).json({ message: "Ce nom d'utilisateur est déjà pris." });
  }
  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'Un compte existe déjà avec cette adresse e-mail.' });
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  let user;
  try {
    user = await User.create({ name: clean(name, 80), username: normalizedUsername, email: normalizedEmail, phone: cleanPhone, passwordHash });
  } catch (err) {
    if (err && err.code === 11000) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'email';
      return res.status(409).json({ message: field === 'username' ? "Ce nom d'utilisateur est déjà pris." : 'Un compte existe déjà avec cette adresse e-mail.' });
    }
    throw err;
  }

  res.status(201).json(sessionFor(user));
}));

/* ---------- Connexion ---------- */
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};

  if (!isString(username) || !username.trim() || username.length > 60 || !isString(password)) {
    return res.status(400).json({ message: "Veuillez saisir votre nom d'utilisateur et votre mot de passe." });
  }

  const user = await User.findOne({ username: normalizeUsername(username) });
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !passwordOk) {
    return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
  }

  res.json(sessionFor(user));
}));

/* ---------- Mon profil ---------- */
router.get('/me', requireUser, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: 'Compte introuvable. Veuillez vous reconnecter.' });
  res.json({ user: serializeUser(user) });
}));

router.patch('/me', requireUser, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: 'Compte introuvable. Veuillez vous reconnecter.' });

  // Le nom d'utilisateur et l'e-mail sont non modifiables : toute tentative de les changer est refusée
  if ('username' in body && (!isString(body.username) || normalizeUsername(body.username) !== (user.username || ''))) {
    return res.status(400).json({ message: "Le nom d'utilisateur ne peut pas être modifié." });
  }
  if ('email' in body && (!isString(body.email) || body.email.trim().toLowerCase() !== user.email)) {
    return res.status(400).json({ message: "L'adresse e-mail ne peut pas être modifiée." });
  }

  if ('name' in body) user.name = clean(body.name, 80);

  if ('phone' in body) {
    const phone = clean(body.phone, 30);
    if (phone && !PHONE_RE.test(phone)) return res.status(400).json({ message: 'Numéro de téléphone invalide.' });
    user.phone = phone;
  }

  if ('photo' in body) {
    if (body.photo === '' || body.photo === null) {
      user.photo = '';
    } else if (validPhoto(body.photo)) {
      user.photo = body.photo;
    } else {
      return res.status(400).json({ message: 'Photo invalide (JPEG, PNG ou WebP, 300 Ko maximum).' });
    }
  }

  await user.save();
  res.json({ user: serializeUser(user) });
}));

/* ---------- Mot de passe oublié ---------- */
router.post('/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!validEmail(email)) return res.status(400).json({ message: 'Adresse e-mail invalide.' });

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = sha256(token);
    user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const link = `${config.clientUrl}/nouveau-mot-de-passe.html?token=${token}`;
    try {
      await sendMail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe - Berlly Boutique',
        text: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 30 minutes) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
      });
    } catch (err) {
      console.error("Envoi de l'e-mail de réinitialisation impossible :", err.message);
    }
  }

  // Même réponse que le compte existe ou non (ne révèle pas quels e-mails sont inscrits)
  res.json({ message: "Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé." });
}));

router.post('/reset-password', authLimiter, asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};

  if (!isString(token) || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ message: 'Lien de réinitialisation invalide ou expiré.' });
  }
  if (!validPassword(password)) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir entre 8 et 72 caractères.' });
  }

  const user = await User.findOne({ resetTokenHash: sha256(token), resetTokenExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ message: 'Lien de réinitialisation invalide ou expiré.' });

  user.passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  user.resetTokenHash = '';
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Mot de passe modifié avec succès.' });
}));

module.exports = router;

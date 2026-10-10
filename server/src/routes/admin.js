const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');

const config = require('../config');
const Order = require('../models/Order');
const { signToken, requireAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/limiters');
const { asyncHandler } = require('../middleware/errors');
const { serializeOrder } = require('../utils/serialize');
const { ORDER_ID_RE, isString } = require('../utils/validate');

const router = express.Router();

const digest = (value) => crypto.createHash('sha256').update(String(value)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

/* ---------- Connexion administrateur ---------- */
router.post('/login', adminLimiter, asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};

  if (!isString(username) || !isString(password)) {
    return res.status(400).json({ message: "Veuillez saisir le nom d'utilisateur et le mot de passe." });
  }
  if (!config.adminUsername || !config.adminPasswordHash) {
    return res.status(503).json({ message: "L'administration n'est pas configurée sur le serveur." });
  }

  let passwordOk = false;
  try {
    passwordOk = await bcrypt.compare(password, config.adminPasswordHash);
  } catch (e) {
    passwordOk = false;
  }

  if (!(safeEqual(username, config.adminUsername) && passwordOk)) {
    return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
  }

  res.json({ token: signToken({ sub: 'admin', role: 'admin' }, '8h') });
}));

/* ---------- Commandes ---------- */
router.get('/orders', requireAdmin, asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    if (!isString(req.query.status) || !Order.STATUSES.includes(req.query.status)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }
    filter.status = req.query.status;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ orders: orders.map(serializeOrder) });
}));

router.patch('/orders/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body || {};

  if (!ORDER_ID_RE.test(req.params.id)) return res.status(400).json({ message: 'Numéro de commande invalide.' });
  if (!isString(status) || !Order.STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }

  const order = await Order.findOne({ orderNumber: req.params.id });
  if (!order) return res.status(404).json({ message: 'Commande introuvable.' });

  order.status = status;
  await order.save();
  res.json({ order: serializeOrder(order) });
}));

router.delete('/orders/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!ORDER_ID_RE.test(req.params.id)) return res.status(400).json({ message: 'Numéro de commande invalide.' });

  const result = await Order.deleteOne({ orderNumber: req.params.id });
  if (!result.deletedCount) return res.status(404).json({ message: 'Commande introuvable.' });

  res.json({ message: 'Commande supprimée.' });
}));

module.exports = router;

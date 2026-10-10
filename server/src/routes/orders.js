const crypto = require('crypto');
const express = require('express');

const User = require('../models/User');
const Order = require('../models/Order');
const { requireUser } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { serializeOrder } = require('../utils/serialize');
const { PHONE_RE, IMAGE_PATH_RE, isString, clean } = require('../utils/validate');

const router = express.Router();

function normalizeCart(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) return null;

  const items = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;

    const name = clean(item.name, 120);
    const { price, quantity } = item;

    if (!name) return null;
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 100000000) return null;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;

    // Seuls les chemins d'images du site sont acceptés (pas de javascript:, pas de liens externes)
    const image = isString(item.image) && IMAGE_PATH_RE.test(item.image) && !item.image.includes('..') ? item.image : '';

    items.push({ name, price, quantity, image });
  }
  return items;
}

const newOrderNumber = () => `CMD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

/* ---------- Passer une commande ---------- */
router.post('/', requireUser, asyncHandler(async (req, res) => {
  const body = req.body || {};

  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: 'Compte introuvable. Veuillez vous reconnecter.' });

  const name = clean(body.name, 80);
  const phone = clean(body.phone, 30);
  const address = clean(body.address, 300);

  if (!name || !phone || !address) {
    return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
  }
  if (!PHONE_RE.test(phone)) return res.status(400).json({ message: 'Numéro de téléphone invalide.' });

  const cart = normalizeCart(body.cart);
  if (!cart) return res.status(400).json({ message: 'Panier invalide ou vide.' });

  // Le total est recalculé ici : on ne fait pas confiance au total envoyé par le navigateur
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const data = {
    user: user._id,
    email: user.email,
    name,
    phone,
    address,
    cart,
    total,
    payment: clean(body.payment, 80),
    transactionRef: clean(body.transactionRef, 80),
  };

  let order;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await Order.create({ ...data, orderNumber: newOrderNumber() });
    } catch (err) {
      if (!(err && err.code === 11000)) throw err; // numéro déjà pris : on réessaie
    }
  }
  if (!order) throw new Error("Impossible de générer un numéro de commande");

  res.status(201).json({ order: serializeOrder(order) });
}));

/* ---------- Mes commandes ---------- */
router.get('/mine', requireUser, asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ orders: orders.map(serializeOrder) });
}));

module.exports = router;

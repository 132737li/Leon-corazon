// Vrais schémas Mongoose (validation hors base de données)
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const User = require('../src/models/User');
const Order = require('../src/models/Order');

const validOrder = () => ({
  orderNumber: 'CMD-1-AAAA',
  user: '507f1f77bcf86cd799439011',
  email: 'a@b.co',
  name: 'Léon',
  phone: '79000000',
  address: 'Bujumbura',
  cart: [{ name: 'Crème', price: 100, quantity: 1 }],
  total: 100,
});

test("User : l'e-mail est déclaré immuable dans le schéma", () => {
  assert.equal(User.schema.path('email').options.immutable, true);
  assert.equal(User.schema.path('email').options.unique, true);
});

test('User : e-mail et hash obligatoires', () => {
  const err = new User({ name: 'x' }).validateSync();
  assert.ok(err.errors.email);
  assert.ok(err.errors.passwordHash);
});

test('Order : commande valide acceptée, statut par défaut "En attente"', () => {
  const order = new Order(validOrder());
  assert.equal(order.validateSync(), undefined);
  assert.equal(order.status, 'En attente');
});

test('Order : statut inconnu, panier vide et quantité hors limites refusés', () => {
  assert.ok(new Order({ ...validOrder(), status: 'Hacké' }).validateSync().errors.status);
  assert.ok(new Order({ ...validOrder(), cart: [] }).validateSync().errors.cart);
  assert.ok(new Order({ ...validOrder(), cart: [{ name: 'x', price: 1, quantity: 500 }] }).validateSync());
  assert.ok(new Order({ ...validOrder(), total: -1 }).validateSync().errors.total);
});

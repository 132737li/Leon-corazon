const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { User, Order, mails } = require('../support/setup');
const { createApp } = require('../src/app');

const app = createApp();
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';
const item = (over = {}) => ({ name: 'Crème visage', price: 15000, quantity: 2, image: 'images/produits/creme.jpg', ...over });

async function signup(email, extra = {}) {
  const res = await request(app).post('/api/auth/register').send({ name: 'Léon Corazón', email, phone: '+257 79 00 00 00', password: 'MotDePasse-123', ...extra });
  return res;
}
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('Santé / CORS / 404', () => {
  test('health', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
  test('CORS : site autorisé accepté, autre site sans en-tête CORS', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'https://boutique.example');
    assert.equal(ok.headers['access-control-allow-origin'], 'https://boutique.example');
    const bad = await request(app).get('/api/health').set('Origin', 'https://pirate.example');
    assert.equal(bad.headers['access-control-allow-origin'], undefined);
  });
  test('route inconnue : 404 JSON', async () => {
    const res = await request(app).get('/api/nimporte');
    assert.equal(res.status, 404);
    assert.ok(res.body.message);
  });
});

describe('Inscription / connexion', () => {
  test('inscription : 201, token, utilisateur sans mot de passe, e-mail en minuscules, mot de passe haché', async () => {
    const res = await signup('Leon@Test.COM');
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'leon@test.com');
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user.password, undefined);
    const stored = User.store.find((u) => u.email === 'leon@test.com');
    assert.match(stored.passwordHash, /^\$2[aby]\$/);
    assert.notEqual(stored.passwordHash, 'MotDePasse-123');
  });

  test('inscription : e-mail déjà utilisé (même en majuscules) = 409', async () => {
    const res = await signup('LEON@test.com');
    assert.equal(res.status, 409);
  });

  test('inscription : entrées invalides = 400', async () => {
    assert.equal((await signup('pas-un-email')).status, 400);
    assert.equal((await signup('ok@test.com', { password: 'court' })).status, 400);
    assert.equal((await signup('ok@test.com', { password: 'x'.repeat(80) })).status, 400);
    assert.equal((await signup('ok@test.com', { phone: 'abc<script>' })).status, 400);
    assert.equal((await signup({ $ne: '' })).status, 400);
  });

  test('connexion : bon mot de passe', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'leon@test.com', password: 'MotDePasse-123' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  test('connexion : mauvais mot de passe et e-mail inconnu donnent le même message', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'leon@test.com', password: 'faux-faux-faux' });
    const b = await request(app).post('/api/auth/login').send({ email: 'inconnu@test.com', password: 'faux-faux-faux' });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.message, b.body.message);
  });

  test("connexion : injection NoSQL ({ \"$gt\": \"\" }) refusée", async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    assert.equal(res.status, 400);
  });
});

describe('Profil', () => {
  let token;
  test('profil : /me exige un jeton valide', async () => {
    assert.equal((await request(app).get('/api/auth/me')).status, 401);
    assert.equal((await request(app).get('/api/auth/me').set(bearer('abc.def.ghi'))).status, 401);
    const login = await request(app).post('/api/auth/login').send({ email: 'leon@test.com', password: 'MotDePasse-123' });
    token = login.body.token;
    const res = await request(app).get('/api/auth/me').set(bearer(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'leon@test.com');
  });

  test('profil : jeton modifié refusé', async () => {
    const tampered = token.slice(0, -3) + (token.endsWith('aaa') ? 'bbb' : 'aaa');
    assert.equal((await request(app).get('/api/auth/me').set(bearer(tampered))).status, 401);
  });

  test('profil : nom, téléphone et photo modifiables', async () => {
    const res = await request(app).patch('/api/auth/me').set(bearer(token)).send({ name: 'Nouveau Nom', phone: '+257 61 11 11 11', photo: PHOTO });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'Nouveau Nom');
    assert.equal(res.body.user.phone, '+257 61 11 11 11');
    assert.equal(res.body.user.photo, PHOTO);
  });

  test("profil : l'e-mail ne peut PAS être modifié", async () => {
    const res = await request(app).patch('/api/auth/me').set(bearer(token)).send({ email: 'pirate@evil.com', name: 'X' });
    assert.equal(res.status, 400);
    assert.equal(User.store.find((u) => u.email === 'leon@test.com').name, 'Nouveau Nom', 'rien ne doit être modifié si la requête est refusée');
    assert.equal(User.store.some((u) => u.email === 'pirate@evil.com'), false);
  });

  test("profil : renvoyer le même e-mail (formulaire complet) est accepté", async () => {
    const res = await request(app).patch('/api/auth/me').set(bearer(token)).send({ email: 'LEON@test.com', name: 'Même Mail' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'leon@test.com');
  });

  test('profil : photo invalide refusée, suppression de la photo acceptée', async () => {
    for (const photo of ['http://evil.com/x.jpg', 'data:text/html;base64,PHNjcmlwdD4=', 'javascript:alert(1)', 'data:image/svg+xml;base64,AAAA', 123]) {
      const res = await request(app).patch('/api/auth/me').set(bearer(token)).send({ photo });
      assert.equal(res.status, 400, String(photo));
    }
    const del = await request(app).patch('/api/auth/me').set(bearer(token)).send({ photo: '' });
    assert.equal(del.status, 200);
    assert.equal(del.body.user.photo, '');
  });

  test('profil : photo énorme refusée', async () => {
    const huge = 'data:image/jpeg;base64,' + 'A'.repeat(1_200_000);
    const res = await request(app).patch('/api/auth/me').set(bearer(token)).send({ photo: huge });
    assert.equal(res.status, 413);
  });
});

describe('Mot de passe oublié', () => {
  test('e-mail inconnu : même réponse, aucun e-mail envoyé', async () => {
    const before = mails.length;
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'inconnu@test.com' });
    assert.equal(res.status, 200);
    assert.equal(mails.length, before);
  });

  test('parcours complet : demande, lien, nouveau mot de passe, lien à usage unique', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'leon@test.com' });
    assert.equal(res.status, 200);

    const mail = mails.at(-1);
    assert.equal(mail.to, 'leon@test.com');
    const token = mail.text.match(/token=([a-f0-9]{64})/)[1];
    assert.ok(mail.text.includes('https://boutique.example/site/nouveau-mot-de-passe.html?token='));

    const stored = User.store.find((u) => u.email === 'leon@test.com');
    assert.notEqual(stored.resetTokenHash, token, 'le jeton ne doit pas être stocké en clair');
    assert.equal(stored.resetTokenHash.length, 64);

    assert.equal((await request(app).post('/api/auth/reset-password').send({ token, password: 'court' })).status, 400);
    assert.equal((await request(app).post('/api/auth/reset-password').send({ token: 'f'.repeat(64), password: 'NouveauMotDePasse-1' })).status, 400);

    const ok = await request(app).post('/api/auth/reset-password').send({ token, password: 'NouveauMotDePasse-1' });
    assert.equal(ok.status, 200);

    assert.equal((await request(app).post('/api/auth/reset-password').send({ token, password: 'AutreMotDePasse-2' })).status, 400, 'réutilisation refusée');
    assert.equal((await request(app).post('/api/auth/login').send({ email: 'leon@test.com', password: 'MotDePasse-123' })).status, 401, "l'ancien mot de passe ne marche plus");
    assert.equal((await request(app).post('/api/auth/login').send({ email: 'leon@test.com', password: 'NouveauMotDePasse-1' })).status, 200);
  });

  test('lien expiré refusé', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: 'leon@test.com' });
    const token = mails.at(-1).text.match(/token=([a-f0-9]{64})/)[1];
    User.store.find((u) => u.email === 'leon@test.com').resetTokenExpires = new Date(Date.now() - 1000);
    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'EncoreUnAutre-3' });
    assert.equal(res.status, 400);
  });
});

describe('Commandes', () => {
  let tokenA, tokenB;

  test('exige une connexion', async () => {
    assert.equal((await request(app).post('/api/orders').send({})).status, 401);
    assert.equal((await request(app).get('/api/orders/mine')).status, 401);
    tokenA = (await request(app).post('/api/auth/login').send({ email: 'leon@test.com', password: 'NouveauMotDePasse-1' })).body.token;
    tokenB = (await signup('autre@test.com')).body.token;
  });

  const base = (over = {}) => ({ name: 'Léon', phone: '79000000', address: 'Bujumbura, Rohero', payment: 'Lumicash', transactionRef: 'TX123', cart: [item(), item({ name: 'Parfum', price: 40000, quantity: 1 })], ...over });

  test('création : total recalculé côté serveur (le total du navigateur est ignoré)', async () => {
    const res = await request(app).post('/api/orders').set(bearer(tokenA)).send(base({ total: 1 }));
    assert.equal(res.status, 201);
    assert.equal(res.body.order.total, 15000 * 2 + 40000);
    assert.match(res.body.order.id, /^CMD-\d+-[0-9A-F]{4}$/);
    assert.equal(res.body.order.status, 'En attente');
    assert.equal(res.body.order.email, 'leon@test.com', "l'e-mail vient du compte, pas du formulaire");
    assert.equal(res.body.order.cart.length, 2);
    assert.equal(res.body.order._id, undefined);
  });

  test('création : paniers et champs invalides refusés', async () => {
    const bad = [
      base({ cart: [] }),
      base({ cart: 'x' }),
      base({ cart: [item({ quantity: 0 })] }),
      base({ cart: [item({ quantity: 1.5 })] }),
      base({ cart: [item({ quantity: 1000 })] }),
      base({ cart: [item({ price: -5 })] }),
      base({ cart: [item({ price: '100' })] }),
      base({ cart: [item({ name: '' })] }),
      base({ cart: Array.from({ length: 51 }, () => item()) }),
      base({ name: '' }),
      base({ address: '' }),
      base({ phone: '<script>' }),
    ];
    for (const body of bad) {
      const res = await request(app).post('/api/orders').set(bearer(tokenA)).send(body);
      assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
    }
  });

  test('création : image dangereuse neutralisée', async () => {
    const res = await request(app).post('/api/orders').set(bearer(tokenA)).send(base({
      cart: [item({ image: 'javascript:alert(1)' }), item({ image: 'https://evil.com/x.png' }), item({ image: 'images/../../secret' })],
    }));
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.order.cart.map((i) => i.image), ['', '', '']);
  });

  test('mes commandes : chacun ne voit que les siennes', async () => {
    await request(app).post('/api/orders').set(bearer(tokenB)).send(base({ name: 'Autre' }));
    const a = await request(app).get('/api/orders/mine').set(bearer(tokenA));
    const b = await request(app).get('/api/orders/mine').set(bearer(tokenB));
    assert.equal(a.status, 200);
    assert.ok(a.body.orders.length >= 2);
    assert.ok(a.body.orders.every((o) => o.email === 'leon@test.com'));
    assert.equal(b.body.orders.length, 1);
    assert.equal(b.body.orders[0].email, 'autre@test.com');
  });
});

describe('Administration', () => {
  let admin, userToken, orderId;

  test('connexion admin : refus puis succès', async () => {
    assert.equal((await request(app).post('/api/admin/login').send({ username: 'patron', password: 'mauvais' })).status, 401);
    assert.equal((await request(app).post('/api/admin/login').send({ username: 'autre', password: 'MotDePasseAdmin-2026' })).status, 401);
    assert.equal((await request(app).post('/api/admin/login').send({ username: { $ne: '' }, password: { $ne: '' } })).status, 400);
    const ok = await request(app).post('/api/admin/login').send({ username: 'patron', password: 'MotDePasseAdmin-2026' });
    assert.equal(ok.status, 200);
    admin = ok.body.token;
    userToken = (await request(app).post('/api/auth/login').send({ email: 'leon@test.com', password: 'NouveauMotDePasse-1' })).body.token;
  });

  test("un client (même connecté) n'a aucun accès admin", async () => {
    assert.equal((await request(app).get('/api/admin/orders')).status, 401);
    assert.equal((await request(app).get('/api/admin/orders').set(bearer(userToken))).status, 401);
  });

  test("le jeton admin n'ouvre pas les routes client", async () => {
    assert.equal((await request(app).get('/api/auth/me').set(bearer(admin))).status, 401);
    assert.equal((await request(app).get('/api/orders/mine').set(bearer(admin))).status, 401);
  });

  test('liste des commandes de tous les clients + filtre', async () => {
    const all = await request(app).get('/api/admin/orders').set(bearer(admin));
    assert.equal(all.status, 200);
    assert.ok(new Set(all.body.orders.map((o) => o.email)).size >= 2);
    orderId = all.body.orders[0].id;
    assert.equal((await request(app).get('/api/admin/orders?status=Livrée').set(bearer(admin))).body.orders.length, 0);
    assert.equal((await request(app).get('/api/admin/orders?status=nimporte').set(bearer(admin))).status, 400);
  });

  test('changement de statut', async () => {
    const ok = await request(app).patch(`/api/admin/orders/${orderId}/status`).set(bearer(admin)).send({ status: 'Confirmée' });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.order.status, 'Confirmée');
    assert.equal((await request(app).patch(`/api/admin/orders/${orderId}/status`).set(bearer(admin)).send({ status: 'Hacké' })).status, 400);
    assert.equal((await request(app).patch('/api/admin/orders/CMD-0000-AAAA/status').set(bearer(admin)).send({ status: 'Livrée' })).status, 404);
    assert.equal((await request(app).patch('/api/admin/orders/..%2Fx/status').set(bearer(admin)).send({ status: 'Livrée' })).status, 400);
    assert.equal((await request(app).patch(`/api/admin/orders/${orderId}/status`).send({ status: 'Livrée' })).status, 401);
  });

  test('le client voit le nouveau statut', async () => {
    const mine = (await request(app).get('/api/orders/mine').set(bearer(userToken))).body.orders;
    const concerned = mine.find((o) => o.id === orderId) || (await request(app).get('/api/orders/mine').set(bearer((await request(app).post('/api/auth/login').send({ email: 'autre@test.com', password: 'MotDePasse-123' })).body.token))).body.orders.find((o) => o.id === orderId);
    assert.equal(concerned.status, 'Confirmée');
  });

  test('suppression', async () => {
    assert.equal((await request(app).delete(`/api/admin/orders/${orderId}`).set(bearer(userToken))).status, 401);
    assert.equal((await request(app).delete(`/api/admin/orders/${orderId}`).set(bearer(admin))).status, 200);
    assert.equal((await request(app).delete(`/api/admin/orders/${orderId}`).set(bearer(admin))).status, 404);
    assert.equal(Order.store.some((o) => o.orderNumber === orderId), false);
  });
});

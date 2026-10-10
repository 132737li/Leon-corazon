process.env.RATE_LIMIT_MAX = '3';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

require('../support/setup');
const { createApp } = require('../src/app');

test('limitation de débit : trop de tentatives de connexion = 429', async () => {
  const app = createApp();
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'peu-importe-1' });
    codes.push(res.status);
  }
  assert.deepEqual(codes, [401, 401, 401, 429, 429]);
});

test('limitation de débit : connexion admin encore plus stricte (5 essais)', async () => {
  const app = createApp();
  const codes = [];
  for (let i = 0; i < 7; i++) {
    const res = await request(app).post('/api/admin/login').send({ username: 'patron', password: 'mauvais-mdp' });
    codes.push(res.status);
  }
  assert.deepEqual(codes, [401, 401, 401, 401, 401, 429, 429]);
});

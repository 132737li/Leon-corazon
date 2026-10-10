require('dotenv').config();

const env = process.env;
const isProd = env.NODE_ENV === 'production';

function required(name) {
  const value = env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name} (voir .env.example)`);
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET doit contenir au moins 32 caractères.');
}

const list = (value) => (value || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);

module.exports = {
  isProd,
  port: Number(env.PORT) || 5000,
  mongoUri: env.MONGODB_URI || '',
  jwtSecret,
  clientOrigins: list(env.CLIENT_ORIGINS),
  clientUrl: (env.CLIENT_URL || '').replace(/\/$/, ''),
  adminUsername: env.ADMIN_USERNAME || '',
  adminPasswordHash: env.ADMIN_PASSWORD_HASH || '',
  rateLimitMax: Number(env.RATE_LIMIT_MAX) || 20,
  bcryptRounds: Number(env.BCRYPT_ROUNDS) || 12,
  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT) || 587,
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || 'Berlly Boutique <lirakoze602@gmail.com>',
  },
};

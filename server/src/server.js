const mongoose = require('mongoose');
const config = require('./config');
const { createApp } = require('./app');

async function start() {
  if (!config.mongoUri) throw new Error('MONGODB_URI manquant (voir .env.example)');

  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connecté');

  if (!config.adminUsername || !config.adminPasswordHash) {
    console.warn("⚠ ADMIN_USERNAME / ADMIN_PASSWORD_HASH absents : l'espace administrateur est désactivé.");
  }
  if (config.isProd && config.clientOrigins.length === 0) {
    console.warn('⚠ CLIENT_ORIGINS est vide : aucun site ne pourra appeler cette API depuis un navigateur.');
  }

  createApp().listen(config.port, () => console.log(`API Berlly Boutique sur le port ${config.port}`));
}

start().catch((err) => {
  console.error('Démarrage impossible :', err.message);
  process.exit(1);
});

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errors');

// Retire le slash final et passe en minuscules pour comparer proprement les origines
const normaliser = (url) => String(url).trim().replace(/\/+$/, '').toLowerCase();

function createApp() {
  const app = express();

  app.set('trust proxy', 1); // derrière le proxy de Render : IP réelle pour la limitation de débit
  app.disable('x-powered-by');

  const originesAutorisees = config.clientOrigins.map(normaliser);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Sans en-tête Origin (curl, tests, UptimeRobot) ou depuis un site autorisé
        if (!origin || originesAutorisees.includes(normaliser(origin))) return callback(null, true);
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  // Routes de santé (pour UptimeRobot et les tests)
  const sante = (req, res) => res.json({ status: 'ok' });
  app.get('/health', sante);
  app.get('/api/health', sante);

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/admin', require('./routes/admin'));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
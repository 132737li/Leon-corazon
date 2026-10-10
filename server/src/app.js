const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errors');

function createApp() {
  const app = express();

  app.set('trust proxy', 1); // derrière le proxy de Render : IP réelle pour la limitation de débit
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Sans en-tête Origin (curl, tests) ou depuis un site autorisé
        if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/admin', require('./routes/admin'));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

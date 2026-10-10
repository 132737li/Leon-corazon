const jwt = require('jsonwebtoken');
const config = require('../config');

function signToken(payload, expiresIn) {
  return jwt.sign(payload, config.jwtSecret, { algorithm: 'HS256', expiresIn });
}

function readToken(req) {
  const [type, token] = (req.headers.authorization || '').split(' ');
  if (type !== 'Bearer' || !token) return null;
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (e) {
    return null;
  }
}

function requireUser(req, res, next) {
  const payload = readToken(req);
  if (!payload || payload.role !== 'user' || !payload.sub) {
    return res.status(401).json({ message: 'Session expirée. Veuillez vous reconnecter.' });
  }
  req.userId = payload.sub;
  next();
}

function requireAdmin(req, res, next) {
  const payload = readToken(req);
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ message: 'Accès administrateur refusé.' });
  }
  next();
}

module.exports = { signToken, requireUser, requireAdmin };

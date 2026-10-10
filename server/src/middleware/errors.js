const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function notFound(req, res) {
  res.status(404).json({ message: 'Ressource introuvable.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Requête trop volumineuse (photo trop lourde ?).' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Requête invalide.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Erreur interne du serveur.' });
}

module.exports = { asyncHandler, notFound, errorHandler };

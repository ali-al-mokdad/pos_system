function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, _next) {
  console.error(err);
  if (err && err.code === 'P2002') {
    return res.status(409).json({ message: `Duplicate value for ${(err.meta && err.meta.target) || 'field'}` });
  }
  if (err && err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
}

module.exports = { notFound, errorHandler };

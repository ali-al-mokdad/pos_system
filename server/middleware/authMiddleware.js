const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return res.status(401).json({ message: 'Inactive or unknown user' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;

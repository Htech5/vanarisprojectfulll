const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vanaris-dev-secret-change-me';

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { hashPassword, verifyPassword, signToken, authMiddleware };

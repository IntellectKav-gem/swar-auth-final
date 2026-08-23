const { verifyToken } = require('../services/token.service');
const { queryOne } = require('../config/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await queryOne('users', { id: decoded.id }, 'id,name,email,role');
    if (!user) return res.status(401).json({ error: 'User account is no longer active' });

    req.user = { ...decoded, id: user.id, name: user.name, email: user.email, role: user.role };
    req.token = token;
    return next();
  } catch (error) {
    return res.status(error.status || 401).json({ error: error.status === 503 ? 'Authentication service unavailable' : 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };

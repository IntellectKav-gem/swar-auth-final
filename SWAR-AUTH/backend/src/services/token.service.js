const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const revokedTokens = new Map();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return secret;
};

const issueToken = (payload) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, getJwtSecret(), { expiresIn: '1h' });
  return { token, jti };
};

const purgeExpiredTokens = () => {
  const now = Date.now();
  for (const [jti, expiresAt] of revokedTokens.entries()) {
    if (expiresAt <= now) revokedTokens.delete(jti);
  }
};

const verifyToken = token => {
  purgeExpiredTokens();
  const decoded = jwt.verify(token, getJwtSecret());
  if (decoded.jti && revokedTokens.has(decoded.jti)) {
    throw new Error('Token has been revoked');
  }
  return decoded;
};

const revokeToken = decoded => {
  if (!decoded?.jti) return;
  const expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + 60 * 60 * 1000;
  revokedTokens.set(decoded.jti, expiresAt);
};

module.exports = { getJwtSecret, issueToken, verifyToken, revokeToken };

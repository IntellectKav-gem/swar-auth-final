const buckets = new Map();

const rateLimit = ({ windowMs = 60_000, max = 60, message = 'Too many requests. Please try again later.' } = {}) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();

    const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:${req.baseUrl}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now - current.startedAt >= windowMs) {
      buckets.set(key, { startedAt: now, count: 1 });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.set('Retry-After', String(Math.ceil((windowMs - (now - current.startedAt)) / 1000)));
      return res.status(429).json({ error: message });
    }

    return next();
  };
};

module.exports = { rateLimit };

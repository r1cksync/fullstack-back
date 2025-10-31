const NodeCache = require('node-cache');

// Create cache instance with TTL from env or default 60 seconds
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 60,
  checkperiod: 120
});

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    res.originalJson = res.json;
    res.json = (body) => {
      cache.set(key, body, duration || parseInt(process.env.CACHE_TTL) || 60);
      res.originalJson(body);
    };
    next();
  };
};

module.exports = { cache, cacheMiddleware };

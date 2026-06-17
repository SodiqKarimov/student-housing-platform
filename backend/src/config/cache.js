const logger = require('./logger');

// Redis mavjud bo'lsa ulanish, bo'lmasa in-memory cache ishlatish
let redisClient = null;
let isRedisAvailable = false;

// In-memory fallback cache (Redis yo'q holatda)
const memoryCache = new Map();
const memoryTTL = new Map();

async function connectCache() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('REDIS_URL sozlanmagan. In-memory cache ishlatiladi.');
    return;
  }

  try {
    const { createClient } = require('redis');
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      logger.error('Redis xato', { error: err.message });
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis ulanish o\'rnatildi');
      isRedisAvailable = true;
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis qayta ulanmoqda...');
    });

    await redisClient.connect();
    isRedisAvailable = true;
  } catch (err) {
    logger.warn('Redis ulanmadi, in-memory cache ishlatiladi', { error: err.message });
    redisClient = null;
    isRedisAvailable = false;
  }
}

// Cache dan olish
async function cacheGet(key) {
  try {
    if (isRedisAvailable && redisClient) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }

    // In-memory fallback
    const expiry = memoryTTL.get(key);
    if (expiry && Date.now() > expiry) {
      memoryCache.delete(key);
      memoryTTL.delete(key);
      return null;
    }
    const val = memoryCache.get(key);
    return val !== undefined ? val : null;
  } catch (err) {
    logger.warn('Cache olishda xato', { key, error: err.message });
    return null;
  }
}

// Cache ga saqlash
async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } else {
      // In-memory fallback
      memoryCache.set(key, value);
      memoryTTL.set(key, Date.now() + ttlSeconds * 1000);

      // Memory limit: 500 dan oshsa eski kalitlarni o'chirish
      if (memoryCache.size > 500) {
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
        memoryTTL.delete(firstKey);
      }
    }
  } catch (err) {
    logger.warn('Cache saqlashda xato', { key, error: err.message });
  }
}

// Cache dan o'chirish
async function cacheDel(key) {
  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.del(key);
    } else {
      memoryCache.delete(key);
      memoryTTL.delete(key);
    }
  } catch (err) {
    logger.warn('Cache o\'chirishda xato', { key, error: err.message });
  }
}

// Pattern bo'yicha o'chirish (masalan: "students:*")
async function cacheDelPattern(pattern) {
  try {
    if (isRedisAvailable && redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) await redisClient.del(keys);
    } else {
      const regexStr = '^' + pattern.replace(/\*/g, '.*') + '$';
      const regex = new RegExp(regexStr);
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
          memoryTTL.delete(key);
        }
      }
    }
  } catch (err) {
    logger.warn('Cache pattern o\'chirishda xato', { pattern, error: err.message });
  }
}

// Cache middleware (GET so'rovlar uchun)
function cacheMiddleware(ttlSeconds = 300, keyFn = null) {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheKey = keyFn
      ? keyFn(req)
      : `cache:${req.originalUrl}:${req.user?.id || 'anon'}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ ...cached, _cached: true });
    }

    // Response ni ushlash
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      if (res.statusCode === 200 && data?.success) {
        await cacheSet(cacheKey, data, ttlSeconds);
      }
      return originalJson(data);
    };

    next();
  };
}

// Cache TTL konstantalari (sekund)
const TTL = {
  SHORT: 60,        // 1 daqiqa
  MEDIUM: 300,      // 5 daqiqa
  LONG: 1800,       // 30 daqiqa
  VERY_LONG: 3600,  // 1 soat
  STATS: 600,       // 10 daqiqa (statistika)
};

module.exports = { connectCache, cacheGet, cacheSet, cacheDel, cacheDelPattern, cacheMiddleware, TTL };

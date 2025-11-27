import Redis from 'ioredis';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
};

const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

// Cache utilities
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
      return false;
    }
  },
};

// Rate limiting utilities
export const rateLimiter = {
  async checkLimit(
    identifier: string,
    maxRequests: number = 100,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `ratelimit:${identifier}`;
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);
      const resetAt = Date.now() + ttl * 1000;
      const remaining = Math.max(0, maxRequests - current);

      return {
        allowed: current <= maxRequests,
        remaining,
        resetAt,
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
    }
  },
};

// Session management
export const session = {
  async set(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<boolean> {
    return cache.set(`session:${sessionId}`, data, ttlSeconds);
  },

  async get<T>(sessionId: string): Promise<T | null> {
    return cache.get<T>(`session:${sessionId}`);
  },

  async delete(sessionId: string): Promise<boolean> {
    return cache.del(`session:${sessionId}`);
  },

  async extend(sessionId: string, ttlSeconds: number = 86400): Promise<boolean> {
    try {
      await redis.expire(`session:${sessionId}`, ttlSeconds);
      return true;
    } catch (error) {
      console.error('Session extend error:', error);
      return false;
    }
  },
};

// Connect on server start
if (process.env.NODE_ENV !== 'test') {
  redis.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
  });
}

export default redis;

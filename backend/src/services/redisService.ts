import { Redis } from 'ioredis';

let redis: Redis | null = null;
let useMemoryCache = false;
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

if (!process.env.DISABLE_REDIS) {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    redis.on('error', (err: any) => {
      console.warn('[Redis Service] Redis connection error, falling back to memory cache:', err.message);
      useMemoryCache = true;
    });

    redis.on('connect', () => {
      console.log('[Redis Service] Connected to Redis successfully');
      useMemoryCache = false;
    });

    redis.connect().catch((err: any) => {
      console.warn('[Redis Service] Connection failed on startup, using memory cache:', err.message);
      useMemoryCache = true;
    });
  } catch (e: any) {
    console.warn('[Redis Service] Failed to initialize Redis client, falling back to memory cache:', e.message);
    useMemoryCache = true;
  }
} else {
  console.log('[Redis Service] Redis is disabled by environment config, using memory cache.');
  useMemoryCache = true;
}

export const cacheSet = async (key: string, value: any, ttlSeconds = 300): Promise<void> => {
  const serialized = JSON.stringify(value);
  if (useMemoryCache || !redis) {
    memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return;
  }
  try {
    await redis.set(key, serialized, 'EX', ttlSeconds);
  } catch (err: any) {
    console.warn('[Redis Service] Failed to set cache key in Redis:', err.message);
    memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (useMemoryCache || !redis) {
    const cached = memoryCache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return JSON.parse(cached.value) as T;
  }
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch (err: any) {
    console.warn('[Redis Service] Failed to get cache key from Redis:', err.message);
    const cached = memoryCache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return JSON.parse(cached.value) as T;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  memoryCache.delete(key);
  if (!useMemoryCache && redis) {
    try {
      await redis.del(key);
    } catch (err: any) {
      console.warn('[Redis Service] Failed to delete cache key in Redis:', err.message);
    }
  }
};

export const cacheClearPrefix = async (prefix: string): Promise<void> => {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  if (!useMemoryCache && redis) {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err: any) {
      console.warn('[Redis Service] Failed to clear keys by prefix in Redis:', err.message);
    }
  }
};

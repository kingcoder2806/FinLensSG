import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis environment variables are not set.');
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

const CACHE_TTL = 60 * 30; // 30 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    const data = await client.get<T>(key);
    return data;
  } catch (err) {
    console.warn('[Redis] cache get failed:', err);
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttl = CACHE_TTL): Promise<void> {
  try {
    const client = getRedis();
    await client.setex(key, ttl, value);
  } catch (err) {
    console.warn('[Redis] cache set failed:', err);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getRedis();
    await client.del(key);
  } catch (err) {
    console.warn('[Redis] cache del failed:', err);
  }
}

export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = CACHE_TTL
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  await cacheSet(key, fresh, ttl);
  return fresh;
}

export const CACHE_KEYS = {
  rates: (category: string) => `finlens:rates:${category}`,
  bank: (slug: string) => `finlens:bank:${slug}`,
  comparison: () => 'finlens:comparison:all',
  topRates: () => 'finlens:top-rates',
} as const;

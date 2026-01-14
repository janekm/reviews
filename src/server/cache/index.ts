import {
  InvalidationRules,
  type InvalidationEntity,
  type InvalidationMeta,
} from "./invalidation";

export { CacheKeys, CacheTTL } from "./keys";
export { InvalidationRules, type InvalidationEntity, type InvalidationMeta };

/**
 * CacheService provides a centralized caching layer using Cloudflare KV.
 *
 * Features:
 * - Type-safe get/set operations
 * - Centralized invalidation rules
 * - Pattern-based bulk invalidation
 * - Automatic JSON serialization
 */
export class CacheService {
  constructor(private kv: KVNamespace) {}

  /**
   * Get a cached value by key.
   * Returns null if not found or expired.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.kv.get(key, "json");
      return cached as T | null;
    } catch {
      // JSON parse error or other issue - treat as cache miss
      return null;
    }
  }

  /**
   * Set a cached value with optional TTL.
   * @param key Cache key
   * @param data Data to cache (will be JSON serialized)
   * @param ttlSeconds Time to live in seconds (default: 300 = 5 minutes)
   */
  async set<T>(key: string, data: T, ttlSeconds = 300): Promise<void> {
    try {
      await this.kv.put(key, JSON.stringify(data), {
        expirationTtl: ttlSeconds,
      });
    } catch (err) {
      // Log but don't throw - caching failures shouldn't break the app
      console.error(`Cache set failed for key ${key}:`, err);
    }
  }

  /**
   * Delete a single cache key.
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (err) {
      console.error(`Cache delete failed for key ${key}:`, err);
    }
  }

  /**
   * Invalidate cache entries for an entity change.
   * Uses centralized invalidation rules to determine which keys to delete.
   *
   * @param entity The type of entity that changed
   * @param id The entity's ID
   * @param meta Additional context for invalidation decisions
   */
  async invalidate(
    entity: InvalidationEntity,
    id: string,
    meta?: InvalidationMeta
  ): Promise<void> {
    const rule = InvalidationRules[entity];
    if (!rule) {
      console.warn(`No invalidation rule for entity: ${entity}`);
      return;
    }

    const keysToInvalidate = rule(id, meta);

    await Promise.all(
      keysToInvalidate.map((key) => {
        if (key.includes("*")) {
          return this.invalidatePattern(key);
        }
        return this.delete(key);
      })
    );
  }

  /**
   * Invalidate all keys matching a pattern.
   * Pattern should use "*" as wildcard (only at the end for prefix matching).
   *
   * Note: KV list operations have limits (1000 keys per call).
   * For high-traffic apps, consider using more specific patterns.
   */
  private async invalidatePattern(pattern: string): Promise<void> {
    const prefix = pattern.replace(/\*$/, "");

    try {
      const list = await this.kv.list({ prefix, limit: 1000 });
      await Promise.all(list.keys.map((k) => this.kv.delete(k.name)));

      // If there are more keys, log a warning
      if (!list.list_complete) {
        console.warn(
          `Pattern invalidation for "${pattern}" may be incomplete - more than 1000 keys matched`
        );
      }
    } catch (err) {
      console.error(`Pattern invalidation failed for ${pattern}:`, err);
    }
  }

  /**
   * Helper for cache-aside pattern: get from cache or fetch and cache.
   *
   * @param key Cache key
   * @param fetcher Function to fetch data if not cached
   * @param ttlSeconds TTL for cached data
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T | null>,
    ttlSeconds = 300
  ): Promise<T | null> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch fresh data
    const fresh = await fetcher();

    // Only cache non-null results
    if (fresh !== null) {
      await this.set(key, fresh, ttlSeconds);
    }

    return fresh;
  }
}

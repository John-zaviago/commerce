import {
  CacheInvalidation,
  CacheKeyGenerator,
  CacheTTLManager
} from './cache-strategy';
import { redisClient } from './client';

export interface CacheOptions {
  ttl?: number;
  queryType?: string;
  userId?: string;
  context?: Record<string, any>;
  forceRefresh?: boolean;
}

export interface CacheResult<T> {
  data: T | null;
  fromCache: boolean;
  cacheKey: string;
  ttl?: number;
}

export class RedisCacheService {
  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redisClient) {
      console.log(`[Redis Cache] Client not available, returning null for key: ${key}`);
      return null;
    }

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        console.log(`[Redis Cache] Hit for key: ${key}`);
        return JSON.parse(cached);
      }
      console.log(`[Redis Cache] Miss for key: ${key}`);
      return null;
    } catch (error) {
      console.error(`[Redis Cache] Get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    if (!redisClient) {
      console.log(`[Redis Cache] Client not available, skipping set for key: ${key}`);
      return false;
    }

    try {
      const serialized = JSON.stringify(data);
      let success;
      if (ttl && ttl > 0) {
        // Use EX option for TTL in seconds
        success = await redisClient.set(key, serialized, 'EX', ttl);
      } else {
        success = await redisClient.set(key, serialized);
      }
      if (success === 'OK') {
        console.log(`[Redis Cache] Set for key: ${key} (TTL: ${ttl}s)`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[Redis Cache] Set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!redisClient) {
      console.log(`[Redis Cache] Client not available, skipping delete for key: ${key}`);
      return false;
    }

    try {
      const success = await redisClient.del(key);
      if (success) {
        console.log(`[Redis Cache] Deleted key: ${key}`);
      }
      return success;
    } catch (error) {
      console.error(`[Redis Cache] Delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!redisClient) {
      return false;
    }

    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error(`[Redis Cache] Exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set data with automatic TTL management
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CacheResult<T>> {
    const { forceRefresh = false, queryType = 'default', context = {} } = options;

    // Try to get from cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return {
          data: cached,
          fromCache: true,
          cacheKey: key,
        };
      }
    }

    // Fetch fresh data
    console.log(`[Redis Cache] Fetching fresh data for key: ${key}`);
    const freshData = await fetchFunction();

    // Determine TTL
    const ttl = options.ttl || CacheTTLManager.getTTL(queryType, context);

    // Cache the fresh data
    await this.set(key, freshData, ttl);

    return {
      data: freshData,
      fromCache: false,
      cacheKey: key,
      ttl,
    };
  }

  /**
   * Cache GraphQL query result
   */
  async cacheGraphQLQuery<T>(
    query: string,
    variables: Record<string, any> = {},
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CacheResult<T>> {
    const { queryType = 'default', userId, context = {} } = options;

    // Generate cache key
    const cacheKey = CacheKeyGenerator.generateKey(
      { query, variables, userId, context: queryType },
      CacheTTLManager.getConfig(queryType)
    );

    return this.getOrSet(cacheKey, fetchFunction, {
      ...options,
      queryType,
      context: { ...context, userId },
    });
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) {
        console.log(`[Redis Cache] No keys found for pattern: ${pattern}`);
        return 0;
      }

      let deletedCount = 0;
      for (const key of keys) {
        const success = await this.delete(key);
        if (success) deletedCount++;
      }

      console.log(`[Redis Cache] Invalidated ${deletedCount} keys for pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      console.error(`[Redis Cache] Invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate product-related caches
   */
  async invalidateProduct(productSlug: string): Promise<number> {
    const patterns = CacheInvalidation.getProductInvalidationKeys(productSlug);
    let totalDeleted = 0;

    for (const pattern of patterns) {
      const deleted = await this.invalidateByPattern(pattern);
      totalDeleted += deleted;
    }

    console.log(`[Redis Cache] Invalidated ${totalDeleted} keys for product: ${productSlug}`);
    return totalDeleted;
  }

  /**
   * Invalidate category-related caches
   */
  async invalidateCategory(categorySlug: string): Promise<number> {
    const patterns = CacheInvalidation.getCategoryInvalidationKeys(categorySlug);
    let totalDeleted = 0;

    for (const pattern of patterns) {
      const deleted = await this.invalidateByPattern(pattern);
      totalDeleted += deleted;
    }

    console.log(`[Redis Cache] Invalidated ${totalDeleted} keys for category: ${categorySlug}`);
    return totalDeleted;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(warmUpFunctions: Array<() => Promise<any>>): Promise<void> {
    console.log('[Redis Cache] Starting cache warm-up...');
    
    const promises = warmUpFunctions.map(async (fn, index) => {
      try {
        await fn();
        console.log(`[Redis Cache] Warm-up ${index + 1}/${warmUpFunctions.length} completed`);
      } catch (error) {
        console.error(`[Redis Cache] Warm-up ${index + 1} failed:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('[Redis Cache] Cache warm-up completed');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    totalKeys: number;
    memoryUsage?: string;
    hitRate?: number;
  }> {
    if (!redisClient) {
      return {
        connected: false,
        totalKeys: 0,
      };
    }

    try {
      const connected = redisClient.getConnectionStatus();
      const allKeys = await redisClient.keys('graphql:*');
      
      return {
        connected,
        totalKeys: allKeys.length,
      };
    } catch (error) {
      console.error('[Redis Cache] Stats error:', error);
      return {
        connected: false,
        totalKeys: 0,
      };
    }
  }

  /**
   * Clear all GraphQL caches
   */
  async clearAllGraphQLCaches(): Promise<boolean> {
    try {
      const keys = await redisClient.keys('graphql:*');
      if (keys.length === 0) {
        console.log('[Redis Cache] No GraphQL cache keys found');
        return true;
      }

      let deletedCount = 0;
      for (const key of keys) {
        const success = await this.delete(key);
        if (success) deletedCount++;
      }

      console.log(`[Redis Cache] Cleared ${deletedCount} GraphQL cache keys`);
      return true;
    } catch (error) {
      console.error('[Redis Cache] Clear all error:', error);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    try {
      const start = Date.now();
      await redisClient.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}

// Create singleton instance
export const redisCacheService = new RedisCacheService();

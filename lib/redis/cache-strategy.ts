import crypto from 'crypto';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string; // Cache key prefix
  version?: string; // Cache version for invalidation
}

export interface CacheKeyOptions {
  query: string;
  variables?: Record<string, any>;
  userId?: string;
  context?: string;
}

// Cache configurations for different data types
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Product data - longer TTL since it changes less frequently
  PRODUCT: {
    ttl: 30 * 60, // 30 minutes
    prefix: 'graphql:product',
    version: 'v1',
  },
  
  // Product list - shorter TTL for more dynamic data
  PRODUCT_LIST: {
    ttl: 10 * 60, // 10 minutes
    prefix: 'graphql:products',
    version: 'v1',
  },
  
  // Category data - longer TTL since categories change rarely
  CATEGORY: {
    ttl: 60 * 60, // 1 hour
    prefix: 'graphql:category',
    version: 'v1',
  },
  
  // Search results - shorter TTL for dynamic search
  SEARCH: {
    ttl: 5 * 60, // 5 minutes
    prefix: 'graphql:search',
    version: 'v1',
  },
  
  // Homepage data - medium TTL
  HOMEPAGE: {
    ttl: 15 * 60, // 15 minutes
    prefix: 'graphql:homepage',
    version: 'v1',
  },
  
  // User-specific data - shorter TTL
  USER: {
    ttl: 5 * 60, // 5 minutes
    prefix: 'graphql:user',
    version: 'v1',
  },
  
  // Default fallback
  DEFAULT: {
    ttl: 10 * 60, // 10 minutes
    prefix: 'graphql:default',
    version: 'v1',
  },
};

export class CacheKeyGenerator {
  /**
   * Generate a cache key for GraphQL queries
   */
  static generateKey(options: CacheKeyOptions, config: CacheConfig): string {
    const { query, variables = {}, userId, context } = options;
    
    // Normalize the query by removing whitespace and comments
    const normalizedQuery = query
      .replace(/\s+/g, ' ')
      .replace(/#.*$/gm, '')
      .trim();
    
    // Create a hash of the query and variables
    const queryHash = crypto
      .createHash('md5')
      .update(normalizedQuery)
      .update(JSON.stringify(variables))
      .digest('hex')
      .substring(0, 12);
    
    // Build the cache key
    const keyParts = [
      config.prefix,
      config.version,
      context || 'default',
      queryHash,
    ];
    
    // Add user ID if provided (for user-specific caching)
    if (userId) {
      keyParts.push(`user:${userId}`);
    }
    
    return keyParts.join(':');
  }
  
  /**
   * Generate cache key for specific query types
   */
  static generateProductKey(slug: string, userId?: string): string {
    return this.generateKey(
      { query: 'product', variables: { slug }, userId },
      CACHE_CONFIGS.PRODUCT
    );
  }
  
  static generateProductListKey(params: Record<string, any>, userId?: string): string {
    return this.generateKey(
      { query: 'products', variables: params, userId },
      CACHE_CONFIGS.PRODUCT_LIST
    );
  }
  
  static generateCategoryKey(slug: string, userId?: string): string {
    return this.generateKey(
      { query: 'category', variables: { slug }, userId },
      CACHE_CONFIGS.CATEGORY
    );
  }
  
  static generateSearchKey(searchTerm: string, filters: Record<string, any>, userId?: string): string {
    return this.generateKey(
      { query: 'search', variables: { search: searchTerm, ...filters }, userId },
      CACHE_CONFIGS.SEARCH
    );
  }
  
  static generateHomepageKey(userId?: string): string {
    return this.generateKey(
      { query: 'homepage', userId },
      CACHE_CONFIGS.HOMEPAGE
    );
  }
}

export class CacheTTLManager {
  /**
   * Get TTL based on query type and context
   */
  static getTTL(queryType: string, context?: Record<string, any>): number {
    const config = CACHE_CONFIGS[queryType.toUpperCase()] || CACHE_CONFIGS.DEFAULT;
    
    // Adjust TTL based on context
    let ttl = config.ttl;
    
    // Reduce TTL for high-traffic periods (you can implement time-based logic)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      // Business hours - reduce TTL for more dynamic data
      ttl = Math.floor(ttl * 0.7);
    }
    
    // Reduce TTL for user-specific queries
    if (context?.userId) {
      ttl = Math.floor(ttl * 0.8);
    }
    
    // Increase TTL for static data
    if (context?.static) {
      ttl = Math.floor(ttl * 1.5);
    }
    
    return Math.max(ttl, 60); // Minimum 1 minute TTL
  }
  
  /**
   * Get cache config for query type
   */
  static getConfig(queryType: string): CacheConfig {
    return CACHE_CONFIGS[queryType.toUpperCase()] || CACHE_CONFIGS.DEFAULT;
  }
}

export class CacheInvalidation {
  /**
   * Generate pattern for invalidating related cache keys
   */
  static getInvalidationPatterns(queryType: string, context?: Record<string, any>): string[] {
    const config = CACHE_CONFIGS[queryType.toUpperCase()] || CACHE_CONFIGS.DEFAULT;
    const patterns: string[] = [];
    
    // Base pattern for the query type
    patterns.push(`${config.prefix}:${config.version}:*`);
    
    // Specific patterns based on context
    if (context?.productId) {
      patterns.push(`${config.prefix}:${config.version}:*product*${context.productId}*`);
    }
    
    if (context?.categoryId) {
      patterns.push(`${config.prefix}:${config.version}:*category*${context.categoryId}*`);
    }
    
    if (context?.userId) {
      patterns.push(`${config.prefix}:${config.version}:*user:${context.userId}*`);
    }
    
    return patterns;
  }
  
  /**
   * Get all cache keys that should be invalidated for a product update
   */
  static getProductInvalidationKeys(productSlug: string): string[] {
    return [
      // Direct product cache
      CacheKeyGenerator.generateProductKey(productSlug),
      // Product list caches
      `${CACHE_CONFIGS.PRODUCT_LIST.prefix}:${CACHE_CONFIGS.PRODUCT_LIST.version}:*`,
      // Homepage cache (might include featured products)
      `${CACHE_CONFIGS.HOMEPAGE.prefix}:${CACHE_CONFIGS.HOMEPAGE.version}:*`,
      // Search caches
      `${CACHE_CONFIGS.SEARCH.prefix}:${CACHE_CONFIGS.SEARCH.version}:*`,
    ];
  }
  
  /**
   * Get all cache keys that should be invalidated for a category update
   */
  static getCategoryInvalidationKeys(categorySlug: string): string[] {
    return [
      // Direct category cache
      CacheKeyGenerator.generateCategoryKey(categorySlug),
      // Product list caches that might include this category
      `${CACHE_CONFIGS.PRODUCT_LIST.prefix}:${CACHE_CONFIGS.PRODUCT_LIST.version}:*`,
      // Homepage cache
      `${CACHE_CONFIGS.HOMEPAGE.prefix}:${CACHE_CONFIGS.HOMEPAGE.version}:*`,
    ];
  }
}

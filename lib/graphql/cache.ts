// GraphQL Query Caching Layer
import { GraphQLClient } from 'graphql-request';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class GraphQLCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private generateKey(query: string, variables?: any): string {
    return `${query}:${JSON.stringify(variables || {})}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  get(query: string, variables?: any): any | null {
    const key = this.generateKey(query, variables);
    const entry = this.cache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`[GraphQL Cache] HIT for key: ${key.substring(0, 50)}...`);
    return entry.data;
  }

  set(query: string, variables: any, data: any, ttl?: number): void {
    const key = this.generateKey(query, variables);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
    
    console.log(`[GraphQL Cache] SET for key: ${key.substring(0, 50)}...`);
  }

  clear(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Cache with different TTLs based on data type
  getTTLForQuery(query: string): number {
    if (query.includes('products')) {
      return 2 * 60 * 1000; // 2 minutes for products
    }
    if (query.includes('categories')) {
      return 10 * 60 * 1000; // 10 minutes for categories
    }
    if (query.includes('featured')) {
      return 5 * 60 * 1000; // 5 minutes for featured products
    }
    return this.DEFAULT_TTL;
  }
}

export const graphqlCache = new GraphQLCache();

// Enhanced GraphQL client with caching
export class CachedGraphQLClient {
  private client: GraphQLClient;

  constructor(endpoint: string, options?: any) {
    this.client = new GraphQLClient(endpoint, options);
  }

  async request<T = any>(query: string, variables?: any): Promise<T> {
    // Check cache first
    const cached = graphqlCache.get(query, variables);
    if (cached) {
      return cached;
    }

    // Make request
    const data = await this.client.request<T>(query, variables);
    
    // Cache the result
    const ttl = graphqlCache.getTTLForQuery(query);
    graphqlCache.set(query, variables, data, ttl);
    
    return data;
  }

  // Invalidate cache for specific patterns
  invalidateCache(pattern?: string): void {
    graphqlCache.clear(pattern);
  }
}

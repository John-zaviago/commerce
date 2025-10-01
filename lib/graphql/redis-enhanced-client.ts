import { GraphQLClient } from 'graphql-request';
import { redisCacheService } from 'lib/redis/cache-service';
import { graphqlClient } from './client';

export interface GraphQLRequestOptions {
  useCache?: boolean;
  cacheTTL?: number;
  queryType?: string;
  userId?: string;
  context?: Record<string, any>;
  forceRefresh?: boolean;
}

export interface GraphQLResponse<T> {
  data: T;
  fromCache: boolean;
  executionTime: number;
  cacheKey?: string;
}

export class RedisEnhancedGraphQLClient {
  private client: GraphQLClient;

  constructor() {
    this.client = graphqlClient;
  }

  /**
   * Execute GraphQL query with Redis caching
   */
  async request<T>(
    query: string,
    variables: Record<string, any> = {},
    options: GraphQLRequestOptions = {}
  ): Promise<GraphQLResponse<T>> {
    const {
      useCache = true,
      cacheTTL,
      queryType = 'default',
      userId,
      context = {},
      forceRefresh = false
    } = options;

    const startTime = Date.now();

    // If caching is disabled, execute directly
    if (!useCache) {
      const data = await this.client.request<T>(query, variables);
      return {
        data,
        fromCache: false,
        executionTime: Date.now() - startTime
      };
    }

    // Use cache service for GraphQL queries
    const cacheResult = await redisCacheService.cacheGraphQLQuery(
      query,
      variables,
      async () => {
        console.log(`[GraphQL] Executing query: ${query.substring(0, 50)}...`);
        return await this.client.request<T>(query, variables);
      },
      {
        ttl: cacheTTL,
        queryType,
        userId,
        context,
        forceRefresh
      }
    );

    return {
      data: cacheResult.data as T,
      fromCache: cacheResult.fromCache,
      executionTime: Date.now() - startTime,
      cacheKey: cacheResult.cacheKey
    };
  }

  /**
   * Execute multiple queries in batch
   */
  async batchRequest<T>(
    requests: Array<{
      query: string;
      variables?: Record<string, any>;
      options?: GraphQLRequestOptions;
    }>
  ): Promise<Array<GraphQLResponse<T>>> {
    const startTime = Date.now();
    console.log(`[GraphQL Batch] Executing ${requests.length} queries`);

    const promises = requests.map(({ query, variables = {}, options = {} }) =>
      this.request<T>(query, variables, options)
    );

    const results = await Promise.all(promises);
    
    console.log(`[GraphQL Batch] Completed in ${Date.now() - startTime}ms`);
    return results;
  }

  /**
   * Health check for GraphQL client
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    try {
      const start = Date.now();
      const testQuery = `
        query HealthCheck {
          generalSettings {
            title
          }
        }
      `;
      
      await this.client.request(testQuery);
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      console.error('[GraphQL Health Check] Error:', error);
      return { status: 'unhealthy' };
    }
  }

  /**
   * Clear GraphQL cache
   */
  async clearCache(): Promise<boolean> {
    try {
      return await redisCacheService.clearAllGraphQLCaches();
    } catch (error) {
      console.error('[GraphQL Cache Clear] Error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    connected: boolean;
    totalKeys: number;
    memoryUsage?: string;
  }> {
    try {
      return await redisCacheService.getStats();
    } catch (error) {
      console.error('[GraphQL Cache Stats] Error:', error);
      return {
        connected: false,
        totalKeys: 0
      };
    }
  }

  /**
   * Invalidate cache for specific product
   */
  async invalidateProductCache(productSlug: string): Promise<number> {
    try {
      return await redisCacheService.invalidateProduct(productSlug);
    } catch (error) {
      console.error('[GraphQL Product Cache Invalidation] Error:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache for specific category
   */
  async invalidateCategoryCache(categorySlug: string): Promise<number> {
    try {
      return await redisCacheService.invalidateCategory(categorySlug);
    } catch (error) {
      console.error('[GraphQL Category Cache Invalidation] Error:', error);
      return 0;
    }
  }
}

// Create singleton instance
export const redisEnhancedGraphQLClient = new RedisEnhancedGraphQLClient();
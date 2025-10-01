import { graphqlBatchClient } from './batch-client';
import { GraphQLFieldOptimizer, QueryContext } from './field-optimizer';
import { redisEnhancedGraphQLClient } from './redis-enhanced-client';

export interface OptimizedQueryOptions {
  useCache?: boolean;
  useBatching?: boolean;
  useFieldOptimization?: boolean;
  context?: QueryContext;
  cacheTTL?: number;
  queryType?: string;
}

export class OptimizedGraphQLClient {
  /**
   * Execute optimized GraphQL query
   */
  async request<T>(
    query: string,
    variables: Record<string, any> = {},
    options: OptimizedQueryOptions = {}
  ): Promise<{
    data: T;
    fromCache: boolean;
    executionTime: number;
    optimizations: string[];
  }> {
    const {
      useCache = true,
      useBatching = false,
      useFieldOptimization = true,
      context = {},
      cacheTTL,
      queryType = 'default'
    } = options;

    const optimizations: string[] = [];
    let optimizedQuery = query;

    // Apply field optimization (temporarily disabled for stability)
    if (useFieldOptimization && false) { // Disabled for now
      optimizedQuery = GraphQLFieldOptimizer.optimizeQuery(query, context);
      if (optimizedQuery !== query) {
        optimizations.push('field-optimization');
      }
    }

    // Use batching if enabled
    if (useBatching) {
      optimizations.push('batching');
      const batchResult = await graphqlBatchClient.addToBatch({
        id: `query-${Date.now()}`,
        query: optimizedQuery,
        variables,
        options: { useCache, cacheTTL, queryType }
      });
      
      return {
        data: batchResult.data as T,
        fromCache: batchResult.fromCache,
        executionTime: batchResult.executionTime,
        optimizations
      };
    }

    // Use Redis-enhanced client
    const result = await redisEnhancedGraphQLClient.request<T>(
      optimizedQuery,
      variables,
      { useCache, cacheTTL, queryType }
    );

    if (result.fromCache) {
      optimizations.push('redis-cache');
    }

    return {
      data: result.data,
      fromCache: result.fromCache,
      executionTime: result.executionTime,
      optimizations
    };
  }

  /**
   * Execute multiple queries in batch
   */
  async batchRequest<T>(
    queries: Array<{
      query: string;
      variables?: Record<string, any>;
      options?: OptimizedQueryOptions;
    }>
  ): Promise<{
    results: Array<{
      data: T | null;
      fromCache: boolean;
      executionTime: number;
      optimizations: string[];
    }>;
    totalExecutionTime: number;
    cacheHits: number;
    cacheMisses: number;
  }> {
    const batchQueries = queries.map((q, index) => ({
      id: `batch-${index}-${Date.now()}`,
      query: q.query, // Field optimization disabled for now
      variables: q.variables || {},
      options: {
        useCache: q.options?.useCache !== false,
        cacheTTL: q.options?.cacheTTL,
        queryType: q.options?.queryType || 'batch'
      }
    }));

    const batchResult = await graphqlBatchClient.executeBatchQueries(batchQueries);

    return {
      results: batchResult.results.map(result => ({
        data: result.data as T,
        fromCache: result.fromCache,
        executionTime: result.executionTime,
        optimizations: ['batching', result.fromCache ? 'redis-cache' : 'fresh-data']
      })),
      totalExecutionTime: batchResult.totalExecutionTime,
      cacheHits: batchResult.cacheHits,
      cacheMisses: batchResult.cacheMisses
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    components: {
      redis: boolean;
      graphql: boolean;
      batching: boolean;
    };
  }> {
    const [redisHealth, graphqlHealth] = await Promise.allSettled([
      redisEnhancedGraphQLClient.healthCheck(),
      redisEnhancedGraphQLClient.healthCheck()
    ]);

    const redisStatus = redisHealth.status === 'fulfilled' && redisHealth.value.status === 'healthy';
    const graphqlStatus = graphqlHealth.status === 'fulfilled' && graphqlHealth.value.status === 'healthy';
    const batchingStatus = true; // Batching is always available

    return {
      status: redisStatus && graphqlStatus ? 'healthy' : 'unhealthy',
      components: {
        redis: redisStatus,
        graphql: graphqlStatus,
        batching: batchingStatus
      }
    };
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<boolean> {
    try {
      await redisEnhancedGraphQLClient.clearCache();
      return true;
    } catch (error) {
      console.error('[Optimized Client] Clear cache error:', error);
      return false;
    }
  }

  /**
   * Get performance statistics
   */
  async getStats(): Promise<{
    cache: any;
    batch: any;
  }> {
    const [cacheStats, batchStats] = await Promise.allSettled([
      redisEnhancedGraphQLClient.getCacheStats(),
      graphqlBatchClient.getBatchStats()
    ]);

    return {
      cache: cacheStats.status === 'fulfilled' ? cacheStats.value : null,
      batch: batchStats.status === 'fulfilled' ? batchStats.value : null
    };
  }

  /**
   * Get product by slug with optimizations
   */
  async getProductBySlug(slug: string): Promise<{
    product: any;
    executionTime: number;
    optimizations: string[];
  }> {
    const startTime = Date.now();
    
    const result = await this.request(
      `query GetProduct($slug: ID!) {
        product(id: $slug, idType: SLUG) {
          id
          name
          slug
          description
          shortDescription
          type
          featured
          averageRating
          reviewCount
          image {
            id
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
          galleryImages {
            nodes {
              id
              sourceUrl
              altText
              mediaDetails {
                width
                height
              }
            }
          }
          ... on Product {
            productCategories {
              nodes {
                id
                name
                slug
              }
            }
          }
          ... on ProductWithPricing {
            price
            regularPrice
            salePrice
          }
          ... on InventoriedProduct {
            stockStatus
            stockQuantity
          }
        }
      }`,
      { slug },
      { 
        useCache: true, 
        useFieldOptimization: true,
        context: { page: 'product-detail' }
      }
    );

    const executionTime = Date.now() - startTime;

    return {
      product: result.data.product,
      executionTime,
      optimizations: result.optimizations
    };
  }

  /**
   * Search products with optimizations
   */
  async searchProducts(searchTerm: string, options: { first?: number } = {}): Promise<{
    products: any[];
    executionTime: number;
    optimizations: string[];
  }> {
    const startTime = Date.now();
    const { first = 20 } = options;
    
    const result = await this.request(
      `query SearchProducts($search: String!, $first: Int!) {
        products(first: $first, where: { search: $search }) {
          nodes {
            id
            name
            slug
            image {
              sourceUrl
              altText
            }
            ... on ProductWithPricing {
              price
              regularPrice
              salePrice
            }
          }
        }
      }`,
      { search: searchTerm, first },
      { 
        useCache: true, 
        useFieldOptimization: true,
        context: { page: 'search' }
      }
    );

    const executionTime = Date.now() - startTime;

    return {
      products: result.data.products?.nodes || [],
      executionTime,
      optimizations: result.optimizations
    };
  }

  /**
   * Get products with optimizations
   */
  async getProducts(options: { first?: number } = {}): Promise<{
    products: any[];
    executionTime: number;
    optimizations: string[];
  }> {
    const startTime = Date.now();
    const { first = 20 } = options;
    
    const result = await this.request(
      `query GetProducts($first: Int!) {
        products(first: $first) {
          nodes {
            id
            name
            slug
            image {
              sourceUrl
              altText
            }
            ... on ProductWithPricing {
              price
              regularPrice
              salePrice
            }
          }
        }
      }`,
      { first },
      { 
        useCache: true, 
        useFieldOptimization: true,
        context: { page: 'product-list' }
      }
    );

    const executionTime = Date.now() - startTime;

    return {
      products: result.data.products?.nodes || [],
      executionTime,
      optimizations: result.optimizations
    };
  }

  /**
   * Get products by category with optimizations
   */
  async getProductsByCategory(categorySlug: string, options: { first?: number } = {}): Promise<{
    products: any[];
    category: any;
    executionTime: number;
    optimizations: string[];
  }> {
    const startTime = Date.now();
    const { first = 20 } = options;
    
    const result = await this.request(
      `query GetProductsByCategory($categorySlug: ID!, $first: Int!) {
        productCategory(id: $categorySlug, idType: SLUG) {
          id
          name
          slug
          description
          image {
            sourceUrl
            altText
          }
        }
        products(first: $first, where: { categoryId: $categorySlug }) {
          nodes {
            id
            name
            slug
            image {
              sourceUrl
              altText
            }
            ... on ProductWithPricing {
              price
              regularPrice
              salePrice
            }
          }
        }
      }`,
      { categorySlug, first },
      { 
        useCache: true, 
        useFieldOptimization: true,
        context: { page: 'category' }
      }
    );

    const executionTime = Date.now() - startTime;

    return {
      products: result.data.products?.nodes || [],
      category: result.data.productCategory,
      executionTime,
      optimizations: result.optimizations
    };
  }

  /**
   * Get homepage data with optimizations
   */
  async getHomepageData(): Promise<{
    products: any[];
    categories: any[];
    executionTime: number;
    optimizations: string[];
  }> {
    const startTime = Date.now();
    
    const [productsResult, categoriesResult] = await Promise.all([
      this.request(
        `query GetProducts {
          products(first: 8) {
            nodes {
              id
              name
              slug
              image {
                sourceUrl
                altText
              }
              ... on ProductWithPricing {
                price
                regularPrice
                salePrice
              }
            }
          }
        }`,
        {},
        { 
          useCache: true, 
          useFieldOptimization: true,
          context: { component: 'homepage-grid' }
        }
      ),
      this.request(
        `query GetCategories {
          productCategories(first: 6) {
            nodes {
              id
              name
              slug
              image { sourceUrl altText }
            }
          }
        }`,
        {},
        { 
          useCache: true, 
          useFieldOptimization: true,
          context: { component: 'homepage-categories' }
        }
      )
    ]);

    const executionTime = Date.now() - startTime;
    const allOptimizations = [...productsResult.optimizations, ...categoriesResult.optimizations];

    return {
      products: productsResult.data.products?.nodes || [],
      categories: categoriesResult.data.productCategories?.nodes || [],
      executionTime,
      optimizations: [...new Set(allOptimizations)] // Remove duplicates
    };
  }
}

// Create singleton instance
export const optimizedGraphQLClient = new OptimizedGraphQLClient();
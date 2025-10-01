// Enhanced GraphQL Client with all optimizations
import { graphqlBatchClient } from './batch';
import { CachedGraphQLClient } from './cache';
import { graphqlErrorHandler } from './error-handler';
import {
    GET_PRODUCT_COMPREHENSIVE_QUERY,
    SEARCH_PRODUCTS_ADVANCED_QUERY
} from './queries';

export class EnhancedGraphQLClient {
  private client: CachedGraphQLClient;

  constructor(endpoint: string, options?: any) {
    this.client = new CachedGraphQLClient(endpoint, options);
  }

  // Optimized product fetching with field selection
  async getProductsOptimized(params: {
    per_page?: number;
    page?: number;
    category?: string;
    search?: string;
    featured?: boolean;
    fields?: string[]; // Allow field selection
  } = {}): Promise<any[]> {
    const { fields, ...queryParams } = params;
    
    // Build dynamic query based on requested fields
    const query = this.buildOptimizedQuery('products', fields);
    
    const variables: any = {
      first: queryParams.per_page || 10,
    };

    const where: any = {};
    if (queryParams.category) where.category = queryParams.category;
    if (queryParams.search) where.search = queryParams.search;
    if (queryParams.featured !== undefined) where.featured = queryParams.featured;

    if (Object.keys(where).length > 0) {
      variables.where = where;
    }

    try {
      const result = await graphqlErrorHandler.withRetry(
        () => graphqlErrorHandler.withCircuitBreaker(
          () => this.client.request(query, variables)
        )
      );

      return this.convertProducts(result.products?.nodes || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Get product with comprehensive data in one query
  async getProductComprehensive(slug: string): Promise<any> {
    try {
      const result = await graphqlErrorHandler.withRetry(
        () => graphqlErrorHandler.withCircuitBreaker(
          () => this.client.request(GET_PRODUCT_COMPREHENSIVE_QUERY, { slug })
        )
      );

      return {
        product: this.convertProduct(result.product),
        related: this.convertProducts(result.products?.nodes || []),
        reviews: result.comments?.nodes || []
      };
    } catch (error) {
      console.error('Error fetching comprehensive product data:', error);
      return { product: null, related: [], reviews: [] };
    }
  }

  // Optimized search with suggestions
  async searchProductsAdvanced(query: string, category?: string): Promise<{
    products: any[];
    suggestions: any[];
  }> {
    try {
      const result = await graphqlErrorHandler.withRetry(
        () => graphqlErrorHandler.withCircuitBreaker(
          () => this.client.request(SEARCH_PRODUCTS_ADVANCED_QUERY, { 
            search: query, 
            category,
            first: 10 
          })
        )
      );

      return {
        products: this.convertProducts(result.products?.nodes || []),
        suggestions: result.productCategories?.nodes || []
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return { products: [], suggestions: [] };
    }
  }

  // Get homepage data in one optimized batch
  async getHomepageData(): Promise<{
    featured: any[];
    categories: any[];
    latest: any[];
  }> {
    try {
      return await graphqlErrorHandler.withRetry(
        () => graphqlErrorHandler.withCircuitBreaker(
          () => graphqlBatchClient.getHomepageData()
        )
      );
    } catch (error) {
      console.error('Error fetching homepage data:', error);
      return { featured: [], categories: [], latest: [] };
    }
  }

  // Build optimized query based on requested fields
  private buildOptimizedQuery(type: string, fields?: string[]): string {
    const defaultFields = {
      products: `
        id
        databaseId
        name
        slug
        price
        regularPrice
        salePrice
        image {
          id
          sourceUrl
          altText
        }
        ... on InventoriedProduct {
          stockStatus
        }
        ... on Product {
          productCategories {
            nodes {
              name
              slug
            }
          }
        }
      `,
      categories: `
        id
        databaseId
        name
        slug
        count
        image {
          id
          sourceUrl
          altText
        }
      `
    };

    const baseFields = defaultFields[type as keyof typeof defaultFields] || defaultFields.products;
    
    if (!fields || fields.length === 0) {
      return `
        query GetOptimized${type.charAt(0).toUpperCase() + type.slice(1)}($first: Int, $where: RootQueryToProductUnionConnectionWhereArgs) {
          ${type}(first: $first, where: $where) {
            nodes {
              ${baseFields}
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;
    }

    // Build custom query with only requested fields
    const customFields = fields.join('\n        ');
    return `
      query GetOptimized${type.charAt(0).toUpperCase() + type.slice(1)}($first: Int, $where: RootQueryToProductUnionConnectionWhereArgs) {
        ${type}(first: $first, where: $where) {
          nodes {
            ${customFields}
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `;
  }

  // Convert GraphQL products to WooCommerce format
  private convertProducts(products: any[]): any[] {
    return products.map(product => this.convertProduct(product));
  }

  private convertProduct(product: any): any {
    if (!product) return null;

    return {
      id: product.databaseId,
      name: product.name,
      slug: product.slug,
      permalink: `/${product.slug}`,
      description: product.description,
      short_description: product.shortDescription,
      price: product.price || '',
      regular_price: product.regularPrice || '',
      sale_price: product.salePrice || '',
      on_sale: product.onSale || false,
      stock_status: product.stockStatus || 'instock',
      type: product.type,
      featured: product.featured,
      average_rating: product.averageRating,
      review_count: product.reviewCount,
      images: product.image ? [{
        id: parseInt(product.image.id),
        src: product.image.sourceUrl,
        alt: product.image.altText,
      }] : [],
      categories: product.productCategories?.nodes?.map((cat: any) => ({
        id: parseInt(cat.id),
        name: cat.name,
        slug: cat.slug,
      })) || [],
      variations: product.variations?.nodes?.map((variation: any) => ({
        id: variation.databaseId,
        price: variation.price,
        regular_price: variation.regularPrice,
        sale_price: variation.salePrice,
        on_sale: variation.onSale,
        stock_status: variation.stockStatus,
        stock_quantity: variation.stockQuantity,
        image: variation.image ? {
          id: parseInt(variation.image.id),
          src: variation.image.sourceUrl,
          alt: variation.image.altText,
        } : null,
      })) || [],
    };
  }

  // Performance monitoring
  async withPerformanceMonitoring<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const endTime = Date.now();
      
      console.log(`[GraphQL Performance] ${operationName}: ${endTime - startTime}ms`);
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      console.error(`[GraphQL Performance] ${operationName} failed after ${endTime - startTime}ms:`, error);
      throw error;
    }
  }

  // Clear cache
  clearCache(pattern?: string): void {
    this.client.invalidateCache(pattern);
  }
}

// Create singleton instance
const GRAPHQL_ENDPOINT = process.env.WOOCOMMERCE_URL 
  ? `${process.env.WOOCOMMERCE_URL}/graphql`
  : 'https://johnp500.sg-host.com/graphql';

export const enhancedGraphQLClient = new EnhancedGraphQLClient(GRAPHQL_ENDPOINT);

// GraphQL Query Batching and Parallel Execution
import { CachedGraphQLClient } from './cache';
import { GET_CATEGORIES_QUERY, GET_FEATURED_PRODUCTS_QUERY, GET_PRODUCTS_QUERY } from './queries';

interface BatchRequest {
  query: string;
  variables?: any;
  key: string;
}

interface BatchResult {
  [key: string]: any;
}

export class GraphQLBatchClient {
  private client: CachedGraphQLClient;
  private batchQueue: BatchRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 10; // 10ms delay to collect requests

  constructor(endpoint: string, options?: any) {
    this.client = new CachedGraphQLClient(endpoint, options);
  }

  // Add request to batch queue
  private addToBatch(query: string, variables: any, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        query,
        variables,
        key,
        resolve,
        reject
      } as any);

      // Set timeout to process batch
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, this.BATCH_DELAY);
      }
    });
  }

  // Process all queued requests in parallel
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const requests = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    console.log(`[GraphQL Batch] Processing ${requests.length} requests in parallel`);

    // Execute all requests in parallel
    const promises = requests.map(async (request) => {
      try {
        const result = await this.client.request(request.query, request.variables);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Batch multiple product requests
  async batchProducts(requests: Array<{ params: any; key: string }>): Promise<BatchResult> {
    const promises = requests.map(({ params, key }) =>
      this.addToBatch(GET_PRODUCTS_QUERY, params, key)
    );

    const results = await Promise.allSettled(promises);
    const batchResult: BatchResult = {};

    requests.forEach(({ key }, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        batchResult[key] = result.value;
      } else {
        batchResult[key] = { error: result.reason };
      }
    });

    return batchResult;
  }

  // Get multiple data types in one batch
  async getHomepageData(): Promise<{
    featured: any[];
    categories: any[];
    latest: any[];
  }> {
    const startTime = Date.now();
    
    const [featured, categories, latest] = await Promise.all([
      this.client.request(GET_FEATURED_PRODUCTS_QUERY, { first: 3 }),
      this.client.request(GET_CATEGORIES_QUERY, { first: 10 }),
      this.client.request(GET_PRODUCTS_QUERY, { first: 6 })
    ]);

    const endTime = Date.now();
    console.log(`[GraphQL Batch] Homepage data fetched in ${endTime - startTime}ms`);

    return {
      featured: featured.products?.nodes || [],
      categories: categories.productCategories?.nodes || [],
      latest: latest.products?.nodes || []
    };
  }

  // Get product with all related data in one batch
  async getProductWithRelatedData(slug: string): Promise<{
    product: any;
    related: any[];
    categories: any[];
  }> {
    const startTime = Date.now();

    // Create a single comprehensive query for product with related data
    const comprehensiveQuery = `
      query GetProductWithRelatedData($slug: ID!) {
        product(id: $slug, idType: SLUG) {
          id
          databaseId
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
        products(first: 4, where: { category: "uncategorized" }) {
          nodes {
            id
            databaseId
            name
            slug
            price
            image {
              id
              sourceUrl
              altText
            }
          }
        }
        productCategories(first: 10) {
          nodes {
            id
            name
            slug
            count
          }
        }
      }
    `;

    const result = await this.client.request(comprehensiveQuery, { slug });
    
    const endTime = Date.now();
    console.log(`[GraphQL Batch] Product with related data fetched in ${endTime - startTime}ms`);

    return {
      product: result.product,
      related: result.products?.nodes || [],
      categories: result.productCategories?.nodes || []
    };
  }
}

// Create singleton instance
const GRAPHQL_ENDPOINT = process.env.WOOCOMMERCE_URL 
  ? `${process.env.WOOCOMMERCE_URL}/graphql`
  : 'https://johnp500.sg-host.com/graphql';

export const graphqlBatchClient = new GraphQLBatchClient(GRAPHQL_ENDPOINT);

import { redisEnhancedGraphQLClient } from './redis-enhanced-client';

export interface BatchQuery {
  id: string;
  query: string;
  variables?: Record<string, any>;
  options?: {
    useCache?: boolean;
    cacheTTL?: number;
    queryType?: string;
  };
}

export interface BatchResult<T> {
  id: string;
  data: T | null;
  error: string | null;
  fromCache: boolean;
  executionTime: number;
}

export interface BatchResponse {
  results: Array<BatchResult<any>>;
  totalExecutionTime: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
}

export class GraphQLBatchClient {
  private batchQueue: BatchQuery[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 10; // 10ms delay to collect queries
  private readonly MAX_BATCH_SIZE = 10;

  /**
   * Add query to batch queue
   */
  async addToBatch<T>(batchQuery: BatchQuery): Promise<BatchResult<T>> {
    return new Promise((resolve) => {
      const queryWithResolver = {
        ...batchQuery,
        resolve: resolve as (result: BatchResult<T>) => void
      };

      this.batchQueue.push(queryWithResolver as any);

      // If batch is full, execute immediately
      if (this.batchQueue.length >= this.MAX_BATCH_SIZE) {
        this.executeBatch();
        return;
      }

      // Set timeout for batch execution
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(() => {
        this.executeBatch();
      }, this.BATCH_DELAY);
    });
  }

  /**
   * Execute all queries in the batch
   */
  private async executeBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const queries = [...this.batchQueue];
    this.batchQueue = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const startTime = Date.now();
    console.log(`[GraphQL Batch] Executing ${queries.length} queries`);

    try {
      // Execute all queries in parallel
      const promises = queries.map(async (queryWithResolver) => {
        const { id, query, variables, options, resolve } = queryWithResolver;
        const queryStartTime = Date.now();

        try {
          const result = await redisEnhancedGraphQLClient.request(
            query,
            variables || {},
            options || {}
          );

          resolve({
            id,
            data: result.data,
            error: null,
            fromCache: result.fromCache,
            executionTime: Date.now() - queryStartTime
          });
        } catch (error) {
          resolve({
            id,
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            fromCache: false,
            executionTime: Date.now() - queryStartTime
          });
        }
      });

      await Promise.all(promises);
      
      console.log(`[GraphQL Batch] Completed ${queries.length} queries in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[GraphQL Batch] Batch execution error:', error);
      
      // Resolve all queries with error
      queries.forEach(({ id, resolve }) => {
        resolve({
          id,
          data: null,
          error: 'Batch execution failed',
          fromCache: false,
          executionTime: 0
        });
      });
    }
  }

  /**
   * Execute multiple queries as a single batch
   */
  async executeBatchQueries(queries: BatchQuery[]): Promise<BatchResponse> {
    const startTime = Date.now();
    const results: Array<BatchResult<any>> = [];
    let cacheHits = 0;
    let cacheMisses = 0;
    let errors = 0;

    console.log(`[GraphQL Batch] Executing ${queries.length} queries in batch`);

    // Execute all queries in parallel
    const promises = queries.map(async (query) => {
      const queryStartTime = Date.now();

      try {
        const result = await redisEnhancedGraphQLClient.request(
          query.query,
          query.variables || {},
          query.options || {}
        );

        const batchResult: BatchResult<any> = {
          id: query.id,
          data: result.data,
          error: null,
          fromCache: result.fromCache,
          executionTime: Date.now() - queryStartTime
        };

        if (result.fromCache) {
          cacheHits++;
        } else {
          cacheMisses++;
        }

        return batchResult;
      } catch (error) {
        errors++;
        return {
          id: query.id,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          fromCache: false,
          executionTime: Date.now() - queryStartTime
        };
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    const totalExecutionTime = Date.now() - startTime;

    console.log(`[GraphQL Batch] Batch completed: ${cacheHits} cache hits, ${cacheMisses} cache misses, ${errors} errors in ${totalExecutionTime}ms`);

    return {
      results,
      totalExecutionTime,
      cacheHits,
      cacheMisses,
      errors
    };
  }

  /**
   * Get batch statistics
   */
  getBatchStats(): {
    queueLength: number;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.batchQueue.length,
      isProcessing: this.batchTimeout !== null
    };
  }

  /**
   * Clear batch queue
   */
  clearBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.batchQueue = [];
  }
}

// Create singleton instance
export const graphqlBatchClient = new GraphQLBatchClient();
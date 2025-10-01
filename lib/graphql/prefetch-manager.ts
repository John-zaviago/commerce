import { optimizedGraphQLClient } from './optimized-client';

export interface PrefetchStrategy {
  name: string;
  priority: 'low' | 'medium' | 'high';
  trigger: 'hover' | 'idle' | 'scroll' | 'manual';
  delay?: number;
  condition?: () => boolean;
}

export interface PrefetchTask {
  strategy: PrefetchStrategy;
  fetchFunction: () => Promise<any>;
  cacheKey: string;
  ttl?: number;
  executed?: boolean;
  timestamp?: number;
}

export class GraphQLPrefetchManager {
  private prefetchQueue: PrefetchTask[] = [];
  private executedPrefetches: Set<string> = new Set();
  private isProcessing = false;
  private idleTimeout: NodeJS.Timeout | null = null;

  /**
   * Add prefetch task to queue
   */
  addPrefetch(task: PrefetchTask): void {
    // Check if already executed
    if (this.executedPrefetches.has(task.cacheKey)) {
      return;
    }

    // Add to queue
    this.prefetchQueue.push({
      ...task,
      timestamp: Date.now()
    });

    // Sort by priority
    this.prefetchQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.strategy.priority] - priorityOrder[a.strategy.priority];
    });

    console.log(`[Prefetch] Added ${task.strategy.name} to queue (priority: ${task.strategy.priority})`);

    // Process queue based on trigger
    this.processQueueByTrigger(task.strategy.trigger);
  }

  /**
   * Process queue based on trigger type
   */
  private processQueueByTrigger(trigger: string): void {
    switch (trigger) {
      case 'hover':
        this.processHoverPrefetch();
        break;
      case 'idle':
        this.processIdlePrefetch();
        break;
      case 'scroll':
        this.processScrollPrefetch();
        break;
      case 'manual':
        this.processManualPrefetch();
        break;
    }
  }

  /**
   * Process hover-triggered prefetch
   */
  private processHoverPrefetch(): void {
    const hoverTasks = this.prefetchQueue.filter(
      task => task.strategy.trigger === 'hover' && !task.executed
    );

    if (hoverTasks.length > 0) {
      const task = hoverTasks[0];
      const delay = task.strategy.delay || 200;

      setTimeout(() => {
        this.executePrefetch(task);
      }, delay);
    }
  }

  /**
   * Process idle-triggered prefetch
   */
  private processIdlePrefetch(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      const idleTasks = this.prefetchQueue.filter(
        task => task.strategy.trigger === 'idle' && !task.executed
      );

      if (idleTasks.length > 0) {
        this.executePrefetch(idleTasks[0]);
      }
    }, 1000); // Wait 1 second of idle time
  }

  /**
   * Process scroll-triggered prefetch
   */
  private processScrollPrefetch(): void {
    // This would be called from scroll event handlers
    const scrollTasks = this.prefetchQueue.filter(
      task => task.strategy.trigger === 'scroll' && !task.executed
    );

    if (scrollTasks.length > 0) {
      this.executePrefetch(scrollTasks[0]);
    }
  }

  /**
   * Process manual prefetch
   */
  private processManualPrefetch(): void {
    const manualTasks = this.prefetchQueue.filter(
      task => task.strategy.trigger === 'manual' && !task.executed
    );

    if (manualTasks.length > 0) {
      this.executePrefetch(manualTasks[0]);
    }
  }

  /**
   * Execute prefetch task
   */
  private async executePrefetch(task: PrefetchTask): Promise<void> {
    if (task.executed || this.executedPrefetches.has(task.cacheKey)) {
      return;
    }

    try {
      console.log(`[Prefetch] Executing ${task.strategy.name}`);
      
      // Check condition if provided
      if (task.strategy.condition && !task.strategy.condition()) {
        console.log(`[Prefetch] Condition not met for ${task.strategy.name}`);
        return;
      }

      // Execute fetch function
      await task.fetchFunction();
      
      // Mark as executed
      task.executed = true;
      this.executedPrefetches.add(task.cacheKey);
      
      console.log(`[Prefetch] Completed ${task.strategy.name}`);
    } catch (error) {
      console.error(`[Prefetch] Error executing ${task.strategy.name}:`, error);
    }
  }

  /**
   * Prefetch product data
   */
  prefetchProduct(productSlug: string, options: {
    priority?: 'low' | 'medium' | 'high';
    trigger?: 'hover' | 'idle' | 'scroll' | 'manual';
    delay?: number;
  } = {}): void {
    const { priority = 'medium', trigger = 'hover', delay = 200 } = options;

    this.addPrefetch({
      strategy: {
        name: `product_${productSlug}`,
        priority,
        trigger,
        delay
      },
      fetchFunction: async () => {
        const query = `
          query GetProduct($slug: String!) {
            product(id: $slug, idType: SLUG) {
              id
              name
              slug
              description
              price
              regularPrice
              salePrice
              onSale
              stockStatus
              images {
                sourceUrl
                altText
              }
              categories {
                name
                slug
              }
            }
          }
        `;

        await optimizedGraphQLClient.request(query, { slug: productSlug }, {
          useCache: true,
          useFieldOptimization: true,
          context: { page: 'product' },
          cacheTTL: 300
        });
      },
      cacheKey: `product:${productSlug}`,
      ttl: 300
    });
  }

  /**
   * Prefetch category data
   */
  prefetchCategory(categorySlug: string, options: {
    priority?: 'low' | 'medium' | 'high';
    trigger?: 'hover' | 'idle' | 'scroll' | 'manual';
    delay?: number;
  } = {}): void {
    const { priority = 'low', trigger = 'idle', delay = 500 } = options;

    this.addPrefetch({
      strategy: {
        name: `category_${categorySlug}`,
        priority,
        trigger,
        delay
      },
      fetchFunction: async () => {
        const query = `
          query GetCategory($slug: String!) {
            productCategory(id: $slug, idType: SLUG) {
              id
              name
              slug
              description
              products(first: 12) {
                nodes {
                  id
                  name
                  slug
                  price
                  image {
                    sourceUrl
                    altText
                  }
                }
              }
            }
          }
        `;

        await optimizedGraphQLClient.request(query, { slug: categorySlug }, {
          useCache: true,
          useFieldOptimization: true,
          context: { component: 'product-grid' },
          cacheTTL: 600
        });
      },
      cacheKey: `category:${categorySlug}`,
      ttl: 600
    });
  }

  /**
   * Get prefetch statistics
   */
  getStats(): {
    queueLength: number;
    executedCount: number;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.prefetchQueue.length,
      executedCount: this.executedPrefetches.size,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Clear prefetch queue
   */
  clearQueue(): void {
    this.prefetchQueue = [];
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
    console.log('[Prefetch] Queue cleared');
  }

  /**
   * Clear executed prefetches
   */
  clearExecuted(): void {
    this.executedPrefetches.clear();
    console.log('[Prefetch] Executed prefetches cleared');
  }
}

// Create singleton instance
export const graphqlPrefetchManager = new GraphQLPrefetchManager();
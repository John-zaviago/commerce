'use client';

interface PrefetchStrategy {
  name: string;
  priority: 'high' | 'medium' | 'low';
  trigger: 'hover' | 'click' | 'scroll' | 'idle' | 'route';
  delay?: number;
  condition?: () => boolean;
}

interface PrefetchItem {
  id: string;
  strategy: PrefetchStrategy;
  fetchFunction: () => Promise<any>;
  cacheKey?: string;
  ttl?: number;
  context?: any;
}

interface PrefetchConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  defaultTTL: number;
  enablePredictive: boolean;
  enableRoutePrefetch: boolean;
}

export class BrowserPrefetchManager {
  private queue: PrefetchItem[] = [];
  private activePrefetches = new Set<string>();
  private config: PrefetchConfig;
  private routeHistory: string[] = [];
  private userBehavior: Map<string, number> = new Map();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(config: Partial<PrefetchConfig> = {}) {
    this.config = {
      maxConcurrent: 3,
      maxQueueSize: 20,
      defaultTTL: 300, // 5 minutes
      enablePredictive: true,
      enableRoutePrefetch: true,
      ...config,
    };

    this.initializeEventListeners();
    this.startCacheCleanup();
  }

  /**
   * Initialize event listeners for prefetch triggers
   */
  private initializeEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Route change detection
    if (this.config.enableRoutePrefetch) {
      window.addEventListener('popstate', () => {
        this.handleRouteChange(window.location.pathname);
      });
    }

    // Idle time detection
    let idleTimer: NodeJS.Timeout;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        this.triggerPrefetch('idle');
      }, 2000); // 2 seconds of inactivity
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    resetIdleTimer();
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > value.ttl * 1000) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Add an item to the prefetch queue
   */
  addPrefetch(item: Omit<PrefetchItem, 'id'>): string {
    const id = `prefetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const prefetchItem: PrefetchItem = { id, ...item };

    // Check if already in queue or active
    if (this.queue.some(p => p.id === id) || this.activePrefetches.has(id)) {
      return id;
    }

    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      // Remove lowest priority item
      this.queue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.strategy.priority] - priorityOrder[a.strategy.priority];
      });
      this.queue.pop();
    }

    this.queue.push(prefetchItem);
    this.processQueue();

    return id;
  }

  /**
   * Process the prefetch queue
   */
  private async processQueue(): Promise<void> {
    if (this.activePrefetches.size >= this.config.maxConcurrent) {
      return;
    }

    // Sort by priority
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.strategy.priority] - priorityOrder[a.strategy.priority];
    });

    const item = this.queue.shift();
    if (!item) return;

    this.activePrefetches.add(item.id);
    
    try {
      await this.executePrefetch(item);
    } catch (error) {
      console.error(`[Prefetch] Error prefetching ${item.id}:`, error);
    } finally {
      this.activePrefetches.delete(item.id);
      // Process next item
      setTimeout(() => this.processQueue(), 0);
    }
  }

  /**
   * Execute a prefetch item
   */
  private async executePrefetch(item: PrefetchItem): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check if already cached
      if (item.cacheKey && this.cache.has(item.cacheKey)) {
        const cached = this.cache.get(item.cacheKey)!;
        const now = Date.now();
        if (now - cached.timestamp < cached.ttl * 1000) {
          console.log(`[Prefetch] ${item.id} already cached, skipping`);
          return;
        }
      }

      // Execute the fetch function
      const data = await item.fetchFunction();
      
      // Cache the result
      if (item.cacheKey && data) {
        const ttl = item.ttl || this.config.defaultTTL;
        this.cache.set(item.cacheKey, {
          data,
          timestamp: Date.now(),
          ttl
        });
      }

      const duration = Date.now() - startTime;
      console.log(`[Prefetch] ${item.id} completed in ${duration}ms`);

    } catch (error) {
      console.error(`[Prefetch] ${item.id} failed:`, error);
    }
  }

  /**
   * Trigger prefetch based on strategy
   */
  triggerPrefetch(trigger: string, context?: any): void {
    const matchingItems = this.queue.filter(item => 
      item.strategy.trigger === trigger && 
      (!item.strategy.condition || item.strategy.condition())
    );

    matchingItems.forEach(item => {
      if (item.strategy.delay) {
        setTimeout(() => this.processQueue(), item.strategy.delay);
      } else {
        this.processQueue();
      }
    });
  }

  /**
   * Handle route changes for predictive prefetching
   */
  private handleRouteChange(newRoute: string): void {
    this.routeHistory.push(newRoute);
    
    // Keep only last 10 routes
    if (this.routeHistory.length > 10) {
      this.routeHistory.shift();
    }

    // Update user behavior tracking
    const count = this.userBehavior.get(newRoute) || 0;
    this.userBehavior.set(newRoute, count + 1);

    // Predict next likely routes
    if (this.config.enablePredictive) {
      this.predictAndPrefetch(newRoute);
    }
  }

  /**
   * Predict and prefetch likely next routes
   */
  private predictAndPrefetch(currentRoute: string): void {
    const predictions = this.getRoutePredictions(currentRoute);
    
    predictions.forEach(prediction => {
      this.addPrefetch({
        strategy: {
          name: `route_${prediction.route}`,
          priority: prediction.priority,
          trigger: 'route',
        },
        fetchFunction: prediction.fetchFunction,
        cacheKey: prediction.cacheKey,
        ttl: prediction.ttl,
      });
    });
  }

  /**
   * Get route predictions based on current route and user behavior
   */
  private getRoutePredictions(currentRoute: string): Array<{
    route: string;
    priority: 'high' | 'medium' | 'low';
    fetchFunction: () => Promise<any>;
    cacheKey: string;
    ttl: number;
  }> {
    const predictions: any[] = [];

    // Homepage predictions
    if (currentRoute === '/') {
      predictions.push(
        {
          route: '/search',
          priority: 'high',
          fetchFunction: () => this.simulateApiCall('categories', 10),
          cacheKey: 'prefetch:categories:homepage',
          ttl: 600,
        },
        {
          route: '/product/[handle]',
          priority: 'medium',
          fetchFunction: () => this.simulateApiCall('featured', 6),
          cacheKey: 'prefetch:featured:homepage',
          ttl: 300,
        }
      );
    }

    // Product list predictions
    if (currentRoute.startsWith('/search')) {
      predictions.push(
        {
          route: '/product/[handle]',
          priority: 'high',
          fetchFunction: () => this.simulateApiCall('products', 8),
          cacheKey: 'prefetch:products:list',
          ttl: 300,
        }
      );
    }

    // Product detail predictions
    if (currentRoute.startsWith('/product/')) {
      predictions.push(
        {
          route: '/search',
          priority: 'medium',
          fetchFunction: () => this.simulateApiCall('categories', 5),
          cacheKey: 'prefetch:categories:product',
          ttl: 600,
        }
      );
    }

    return predictions;
  }

  /**
   * Simulate API call for demo purposes
   */
  private async simulateApiCall(type: string, count: number): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          type,
          count,
          data: Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: `${type} item ${i + 1}`,
            timestamp: Date.now()
          }))
        });
      }, Math.random() * 500 + 100);
    });
  }

  /**
   * Prefetch on hover
   */
  prefetchOnHover(element: HTMLElement, prefetchItem: Omit<PrefetchItem, 'id' | 'strategy'>): void {
    let hoverTimer: NodeJS.Timeout;

    element.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(() => {
        this.addPrefetch({
          ...prefetchItem,
          strategy: {
            name: `hover_${prefetchItem.id || 'unknown'}`,
            priority: 'medium',
            trigger: 'hover',
            delay: 200, // 200ms delay on hover
          },
        });
      }, 200);
    });

    element.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
    });
  }

  /**
   * Get prefetch statistics
   */
  getStats(): {
    queueLength: number;
    activePrefetches: number;
    routeHistory: string[];
    userBehavior: Record<string, number>;
    config: PrefetchConfig;
    cacheSize: number;
  } {
    return {
      queueLength: this.queue.length,
      activePrefetches: this.activePrefetches.size,
      routeHistory: [...this.routeHistory],
      userBehavior: Object.fromEntries(this.userBehavior),
      config: this.config,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Clear prefetch queue
   */
  clearQueue(): void {
    this.queue = [];
    this.activePrefetches.clear();
  }

  /**
   * Cancel a specific prefetch
   */
  cancelPrefetch(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get cached data
   */
  getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return cached.data;
    }
    return null;
  }
}

// Create singleton instance
export const browserPrefetchManager = new BrowserPrefetchManager({
  maxConcurrent: 3,
  maxQueueSize: 15,
  defaultTTL: 300,
  enablePredictive: true,
  enableRoutePrefetch: true,
});

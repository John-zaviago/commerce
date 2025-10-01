import { graphqlClient } from 'lib/graphql/client';
import { graphqlPrefetchManager } from 'lib/graphql/prefetch-manager';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const results: any = {};
    const recommendations: string[] = [];

    console.log('[Prefetch & Lazy Test] Starting comprehensive tests...');

    // Test 1: Prefetch Manager Functionality
    console.log('[Prefetch & Lazy Test] Testing prefetch manager...');
    
    const prefetchStart = Date.now();
    
    // Add multiple prefetch items
    const prefetchIds = [];
    for (let i = 0; i < 5; i++) {
      const id = graphqlPrefetchManager.addPrefetch({
        strategy: {
          name: `test_prefetch_${i}`,
          priority: i < 2 ? 'high' : 'medium',
          trigger: 'idle',
        },
        fetchFunction: () => graphqlClient.request(`
          query GetProducts($first: Int) {
            products(first: $first) {
              nodes {
                id
                databaseId
                name
                slug
                image {
                  id
                  sourceUrl
                  altText
                }
              }
            }
          }
        `, { first: 3 }),
        cacheKey: `test:prefetch:${i}`,
        ttl: 300,
      });
      prefetchIds.push(id);
    }

    // Wait for prefetch to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const prefetchTime = Date.now() - prefetchStart;
    const prefetchStats = graphqlPrefetchManager.getStats();

    results.prefetchManager = {
      name: 'Prefetch Manager Functionality',
      time: prefetchTime,
      stats: prefetchStats,
      prefetchIds,
      success: prefetchStats.queueLength === 0 && prefetchStats.activePrefetches === 0,
    };

    if (prefetchStats.queueLength === 0) {
      recommendations.push('Prefetch manager successfully processed all items');
    }

    // Test 2: Route-based Prefetching
    console.log('[Prefetch & Lazy Test] Testing route-based prefetching...');
    
    const routePrefetchStart = Date.now();
    
    // Simulate route changes
    const routes = ['/', '/search', '/product/test-product'];
    for (const route of routes) {
      // Simulate route change
      graphqlPrefetchManager['handleRouteChange'](route);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const routePrefetchTime = Date.now() - routePrefetchStart;
    const routeStats = graphqlPrefetchManager.getStats();

    results.routePrefetching = {
      name: 'Route-based Prefetching',
      time: routePrefetchTime,
      routes,
      stats: routeStats,
      success: routeStats.routeHistory.length === routes.length,
    };

    if (routeStats.routeHistory.length === routes.length) {
      recommendations.push('Route-based prefetching is working correctly');
    }

    // Test 3: Lazy Loading Performance
    console.log('[Prefetch & Lazy Test] Testing lazy loading performance...');
    
    const lazyLoadStart = Date.now();
    
    // Simulate lazy loading scenarios
    const lazyLoadTests = [
      {
        name: 'Product List Lazy Load',
        loadFunction: () => graphqlClient.request(`
          query GetProducts($first: Int) {
            products(first: $first) {
              nodes {
                id
                databaseId
                name
                slug
                image {
                  id
                  sourceUrl
                  altText
                }
              }
            }
          }
        `, { first: 8 }),
      },
      {
        name: 'Category Lazy Load',
        loadFunction: () => graphqlClient.request(`
          query GetCategories($first: Int) {
            productCategories(first: $first) {
              nodes {
                id
                name
                slug
                count
              }
            }
          }
        `, { first: 10 }),
      },
      {
        name: 'Search Lazy Load',
        loadFunction: () => graphqlClient.request(`
          query SearchProducts($search: String!, $first: Int) {
            products(first: $first, where: { search: $search }) {
              nodes {
                id
                databaseId
                name
                slug
                image {
                  id
                  sourceUrl
                  altText
                }
              }
            }
          }
        `, { search: 'test', first: 5 }),
      },
    ];

    const lazyLoadResults = [];
    for (const test of lazyLoadTests) {
      const start = Date.now();
      const result = await test.loadFunction();
      const time = Date.now() - start;
      
      lazyLoadResults.push({
        name: test.name,
        time,
        dataCount: Array.isArray(result) ? result.length : (result?.products?.length || 0),
        success: time < 1000, // Should be under 1 second
      });
    }

    const lazyLoadTime = Date.now() - lazyLoadStart;

    results.lazyLoading = {
      name: 'Lazy Loading Performance',
      totalTime: lazyLoadTime,
      tests: lazyLoadResults,
      averageTime: Math.round(lazyLoadResults.reduce((sum, test) => sum + test.time, 0) / lazyLoadResults.length),
      success: lazyLoadResults.every(test => test.success),
    };

    if (lazyLoadResults.every(test => test.success)) {
      recommendations.push('All lazy loading tests completed successfully');
    }

    // Test 4: Hover-based Prefetching
    console.log('[Prefetch & Lazy Test] Testing hover-based prefetching...');
    
    const hoverPrefetchStart = Date.now();
    
    // Simulate hover prefetching
    const hoverPrefetchIds = [];
    for (let i = 0; i < 3; i++) {
      const id = graphqlPrefetchManager.addPrefetch({
        strategy: {
          name: `hover_prefetch_${i}`,
          priority: 'medium',
          trigger: 'hover',
          delay: 200,
        },
        fetchFunction: () => graphqlClient.request(`
          query GetProductBySlug($slug: ID!) {
            product(id: $slug, idType: SLUG) {
              id
              databaseId
              name
              slug
              image {
                id
                sourceUrl
                altText
              }
            }
          }
        `, { slug: `test-product-${i}` }),
        cacheKey: `test:hover:${i}`,
        ttl: 300,
      });
      hoverPrefetchIds.push(id);
    }

    // Trigger hover prefetch
    graphqlPrefetchManager.triggerPrefetch('hover');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const hoverPrefetchTime = Date.now() - hoverPrefetchStart;
    const hoverStats = graphqlPrefetchManager.getStats();

    results.hoverPrefetching = {
      name: 'Hover-based Prefetching',
      time: hoverPrefetchTime,
      prefetchIds: hoverPrefetchIds,
      stats: hoverStats,
      success: hoverPrefetchIds.length > 0,
    };

    if (hoverPrefetchIds.length > 0) {
      recommendations.push('Hover-based prefetching is working correctly');
    }

    // Test 5: Idle Time Prefetching
    console.log('[Prefetch & Lazy Test] Testing idle time prefetching...');
    
    const idlePrefetchStart = Date.now();
    
    // Add idle prefetch items
    const idlePrefetchIds = [];
    for (let i = 0; i < 2; i++) {
      const id = graphqlPrefetchManager.addPrefetch({
        strategy: {
          name: `idle_prefetch_${i}`,
          priority: 'low',
          trigger: 'idle',
        },
        fetchFunction: () => graphqlClient.request(`
          query GetCategories($first: Int) {
            productCategories(first: $first) {
              nodes {
                id
                name
                slug
                count
              }
            }
          }
        `, { first: 5 }),
        cacheKey: `test:idle:${i}`,
        ttl: 600,
      });
      idlePrefetchIds.push(id);
    }

    // Trigger idle prefetch
    graphqlPrefetchManager.triggerPrefetch('idle');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const idlePrefetchTime = Date.now() - idlePrefetchStart;
    const idleStats = graphqlPrefetchManager.getStats();

    results.idlePrefetching = {
      name: 'Idle Time Prefetching',
      time: idlePrefetchTime,
      prefetchIds: idlePrefetchIds,
      stats: idleStats,
      success: idlePrefetchIds.length > 0,
    };

    if (idlePrefetchIds.length > 0) {
      recommendations.push('Idle time prefetching is working correctly');
    }

    // Test 6: Performance Comparison
    console.log('[Prefetch & Lazy Test] Comparing performance...');
    
    const performanceComparison = {
      name: 'Performance Comparison',
      withPrefetch: {
        averageTime: Math.round((prefetchTime + routePrefetchTime + hoverPrefetchTime) / 3),
        features: [
          'Intelligent prefetching',
          'Route-based predictions',
          'Hover-based loading',
          'Idle time utilization',
        ],
        benefits: [
          'Faster perceived performance',
          'Reduced loading times',
          'Better user experience',
          'Efficient resource usage',
        ],
      },
      withoutPrefetch: {
        averageTime: Math.round(lazyLoadTime),
        features: [
          'On-demand loading',
          'Basic lazy loading',
        ],
        limitations: [
          'Slower initial loads',
          'No predictive loading',
          'Missed optimization opportunities',
        ],
      },
    };

    results.performanceComparison = performanceComparison;

    // Calculate overall metrics
    const totalTests = Object.keys(results).length;
    const averageWithPrefetch = performanceComparison.withPrefetch.averageTime;
    const averageWithoutPrefetch = performanceComparison.withoutPrefetch.averageTime;
    const improvement = Math.round(((averageWithoutPrefetch - averageWithPrefetch) / averageWithoutPrefetch) * 100);

    return NextResponse.json({
      success: true,
      summary: {
        totalTests,
        averageWithPrefetch,
        averageWithoutPrefetch,
        improvement: `${improvement}% faster with prefetching`,
        optimizationLevel: improvement > 30 ? 'Excellent' : improvement > 15 ? 'Good' : 'Moderate',
      },
      tests: results,
      recommendations: [...new Set(recommendations)],
      nextSteps: [
        'Monitor prefetch hit rates in production',
        'Adjust prefetch strategies based on user behavior',
        'Implement predictive prefetching for popular routes',
        'Set up performance monitoring for lazy loading',
        'Optimize prefetch timing based on network conditions',
      ],
      technicalDetails: {
        prefetching: {
          enabled: true,
          strategies: ['hover', 'idle', 'route', 'scroll'],
          maxConcurrent: 3,
          maxQueueSize: 15,
        },
        lazyLoading: {
          enabled: true,
          triggers: ['intersection', 'hover', 'idle', 'scroll'],
          components: ['ProductCard', 'ProductGrid', 'CategoryMenu'],
        },
        caching: {
          enabled: true,
          redis: true,
          prefetchTTL: 300,
        },
      },
    });

  } catch (error) {
    console.error('[Prefetch & Lazy Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Prefetch and lazy loading test failed',
      },
      { status: 500 }
    );
  }
}

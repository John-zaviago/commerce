'use client';

import { browserPrefetchManager } from 'lib/graphql/browser-prefetch-manager';
import { optimizedGraphQLClient } from 'lib/graphql/optimized-client';
import { GraphQLProduct } from 'lib/graphql/types';
import { useEffect, useRef, useState } from 'react';
import EnhancedProductCard from './product-card';

interface ProductRecommendationsProps {
  currentProduct?: GraphQLProduct;
  category?: string;
  limit?: number;
  enablePrefetching?: boolean;
  enableLazyLoading?: boolean;
  showPrefetchIndicator?: boolean;
  title?: string;
  onProductHover?: (product: GraphQLProduct) => void;
  onProductPrefetch?: (product: GraphQLProduct) => void;
}

export default function ProductRecommendations({
  currentProduct,
  category,
  limit = 6,
  enablePrefetching = true,
  enableLazyLoading = true,
  showPrefetchIndicator = false,
  title = "You might also like",
  onProductHover,
  onProductPrefetch,
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<GraphQLProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefetchStats, setPrefetchStats] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recommendations
  useEffect(() => {
    loadRecommendations();
  }, [currentProduct, category, limit]);

  // Update prefetch stats
  useEffect(() => {
    const updateStats = () => {
      const stats = browserPrefetchManager.getStats();
      setPrefetchStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lazy load recommendations when container is visible
  useEffect(() => {
    if (!enableLazyLoading || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && recommendations.length === 0) {
            loadRecommendations();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [enableLazyLoading, recommendations.length]);

  const loadRecommendations = async () => {
    setLoading(true);
    
    try {
      console.log(`[ProductRecommendations] Loading recommendations for category: ${category}`);
      
      // Fetch actual GraphQL recommendations
      const graphqlResult = await optimizedGraphQLClient.getProducts({ first: limit });
      const allProducts = graphqlResult.products;
      
      // Filter out current product if provided
      const filteredProducts = currentProduct 
        ? allProducts.filter(p => p.id !== currentProduct.id)
        : allProducts;
      
      // Take the requested number of recommendations
      const recommendations = filteredProducts.slice(0, limit);
      
      console.log(`[ProductRecommendations] Loaded ${recommendations.length} recommendations`, {
        executionTime: graphqlResult.executionTime,
        optimizations: graphqlResult.optimizations
      });

      setRecommendations(recommendations);
      
      // Prefetch recommendations on idle
      if (enablePrefetching) {
        recommendations.forEach((product, index) => {
          browserPrefetchManager.addPrefetch({
            strategy: {
              name: `recommendation_${product.slug}`,
              priority: 'low',
              trigger: 'idle',
              delay: index * 100, // Stagger the prefetching
            },
            fetchFunction: async () => {
              console.log(`[Prefetch] Loading GraphQL recommendation: ${product.name}`);
              try {
                const graphqlResult = await optimizedGraphQLClient.getProductBySlug(product.slug);
                return graphqlResult.product;
              } catch (error) {
                console.error(`[Prefetch] Failed to load recommendation: ${product.name}`, error);
                throw error;
              }
            },
            cacheKey: `recommendation:${product.slug}`,
            ttl: 600,
          });
        });
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductHover = (product: WooCommerceProduct) => {
    onProductHover?.(product);
    
    if (enablePrefetching) {
      browserPrefetchManager.addPrefetch({
        strategy: {
          name: `recommendation_hover_${product.slug}`,
          priority: 'medium',
          trigger: 'hover',
          delay: 150,
        },
        fetchFunction: async () => {
          console.log(`[Prefetch] Hover prefetch for recommendation: ${product.name}`);
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ product: product.slug, prefetched: true });
            }, 150);
          });
        },
        cacheKey: `hover:recommendation:${product.slug}`,
        ttl: 300,
      });
    }
  };

  const handleProductPrefetch = (product: WooCommerceProduct) => {
    onProductPrefetch?.(product);
    console.log(`[Prefetch] Recommendation prefetched: ${product.name}`);
  };

  if (loading && recommendations.length === 0) {
    return (
      <div ref={containerRef} className="product-recommendations">
        <h3 className="text-xl font-semibold mb-6">{title}</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="product-recommendations">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        
        {/* Prefetch Stats (optional) */}
        {showPrefetchIndicator && prefetchStats && (
          <div className="text-xs text-gray-500">
            Queue: {prefetchStats.queueLength} | Cache: {prefetchStats.cacheSize}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {recommendations.map((product) => (
          <EnhancedProductCard
            key={product.slug}
            product={product}
            enablePrefetching={enablePrefetching}
            enableLazyLoading={enableLazyLoading}
            showPrefetchIndicator={showPrefetchIndicator}
            onHover={handleProductHover}
            onPrefetch={handleProductPrefetch}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {loading && recommendations.length > 0 && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600 text-sm">Loading more...</span>
        </div>
      )}
    </div>
  );
}

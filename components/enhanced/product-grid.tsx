'use client';

import { browserPrefetchManager } from 'lib/graphql/browser-prefetch-manager';
import { GraphQLProduct } from 'lib/graphql/types';
import { useEffect, useRef, useState } from 'react';
import EnhancedProductCard from './product-card';

interface EnhancedProductGridProps {
  products: GraphQLProduct[];
  enablePrefetching?: boolean;
  enableLazyLoading?: boolean;
  enableInfiniteScroll?: boolean;
  showPrefetchIndicator?: boolean;
  pageSize?: number;
  onLoadMore?: () => void;
  onProductHover?: (product: GraphQLProduct) => void;
  onProductPrefetch?: (product: GraphQLProduct) => void;
}

export default function EnhancedProductGrid({
  products,
  enablePrefetching = true,
  enableLazyLoading = true,
  enableInfiniteScroll = true,
  showPrefetchIndicator = false,
  pageSize = 12,
  onLoadMore,
  onProductHover,
  onProductPrefetch,
}: EnhancedProductGridProps) {
  const [visibleProducts, setVisibleProducts] = useState<GraphQLProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [prefetchStats, setPrefetchStats] = useState<any>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initialize with first batch of products
  useEffect(() => {
    if (enableLazyLoading) {
      setVisibleProducts(products.slice(0, pageSize));
      setHasMore(products.length > pageSize);
    } else {
      setVisibleProducts(products);
      setHasMore(false);
    }
  }, [products, enableLazyLoading, pageSize]);

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

  // Infinite scroll
  useEffect(() => {
    if (!enableInfiniteScroll || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && hasMore && !loading) {
            loadMoreProducts();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, enableInfiniteScroll]);

  const loadMoreProducts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const nextPage = currentPage + 1;
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const nextBatch = products.slice(startIndex, endIndex);

    if (nextBatch.length === 0) {
      setHasMore(false);
    } else {
      setVisibleProducts(prev => [...prev, ...nextBatch]);
      setCurrentPage(nextPage);
    }

    setLoading(false);
    onLoadMore?.();
  };

  const handleProductHover = (product: GraphQLProduct) => {
    onProductHover?.(product);
    
    // Track user behavior for prefetching
    if (enablePrefetching) {
      browserPrefetchManager.addPrefetch({
        strategy: {
          name: `product_hover_${product.slug}`,
          priority: 'medium',
          trigger: 'hover',
          delay: 100,
        },
        fetchFunction: async () => {
          console.log(`[Prefetch] Hover prefetch for: ${product.name}`);
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ product: product.slug, prefetched: true });
            }, 200);
          });
        },
        cacheKey: `hover:product:${product.slug}`,
        ttl: 300,
      });
    }
  };

  const handleProductPrefetch = (product: GraphQLProduct) => {
    onProductPrefetch?.(product);
    console.log(`[Prefetch] Product prefetched: ${product.name}`);
  };

  return (
    <div className="enhanced-product-grid">
      {/* Prefetch Stats (optional) */}
      {showPrefetchIndicator && prefetchStats && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">🚀 Prefetching Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="font-medium">Queue:</span> {prefetchStats.queueLength}
            </div>
            <div>
              <span className="font-medium">Active:</span> {prefetchStats.activePrefetches}
            </div>
            <div>
              <span className="font-medium">Cache:</span> {prefetchStats.cacheSize}
            </div>
            <div>
              <span className="font-medium">Routes:</span> {prefetchStats.routeHistory.length}
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleProducts.map((product) => (
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

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Loading more products...</span>
        </div>
      )}

      {/* Load more trigger */}
      {hasMore && enableInfiniteScroll && (
        <div ref={loadMoreRef} className="h-4"></div>
      )}

      {/* End of results */}
      {!hasMore && visibleProducts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          Showing all {visibleProducts.length} products
        </div>
      )}

      {/* No products */}
      {visibleProducts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

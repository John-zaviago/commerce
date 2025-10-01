'use client';

import { optimizedGraphQLClient } from 'lib/graphql/optimized-client';
import { createInfiniteScrollLoader } from 'lib/lazy-loading/lazy-loader';
import { useEffect, useState } from 'react';
import { LazyProductCardWrapper } from './lazy-product-card';

interface LazyProductGridProps {
  initialProducts?: any[];
  category?: string;
  search?: string;
  featured?: boolean;
  pageSize?: number;
}

// Create infinite scroll loader for products
const InfiniteProductLoader = createInfiniteScrollLoader(
  async (page: number) => {
    const products = await optimizedGraphQLClient.getProducts({
      first: 12, // Load 12 products per page
      where: {
        category: category,
        search: search,
        featured: featured,
      }
    }, {
      page: 'product-list',
      userType: 'guest',
      device: 'desktop',
      priority: 'performance',
    });
    
    return products;
  },
  {
    threshold: 0.1,
    rootMargin: '200px',
    initialPage: 1,
  }
);

export function LazyProductGrid({ 
  initialProducts = [], 
  category, 
  search, 
  featured,
  pageSize = 12 
}: LazyProductGridProps) {
  const [products, setProducts] = useState(initialProducts);

  // Update products when props change
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts, category, search, featured]);

  return (
    <div className="lazy-product-grid">
      <InfiniteProductLoader>
        {(items, loading, hasMore) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((product: any) => (
                <LazyProductCardWrapper
                  key={product.id}
                  product={product}
                  onHover={() => {
                    // Track user behavior for prefetching
                    console.log(`User hovered product: ${product.name}`);
                  }}
                />
              ))}
            </div>
            
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-gray-600">Loading more products...</span>
              </div>
            )}
            
            {!hasMore && items.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                No more products to load
              </div>
            )}
          </>
        )}
      </InfiniteProductLoader>
    </div>
  );
}

// Lazy load product grid with intersection observer
export function LazyProductGridIntersection({ 
  category, 
  search, 
  featured 
}: {
  category?: string;
  search?: string;
  featured?: boolean;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [gridRef, setGridRef] = useState<HTMLDivElement | null>(null);

  const loadProducts = async (pageNum: number) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const newProducts = await optimizedGraphQLClient.getProducts({
        first: 12,
        where: {
          category,
          search,
          featured,
        }
      }, {
        page: 'product-list',
        userType: 'guest',
        device: 'desktop',
        priority: 'performance',
      });

      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => pageNum === 1 ? newProducts : [...prev, ...newProducts]);
        setPage(pageNum + 1);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!gridRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && hasMore && !loading) {
            loadProducts(page);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
      }
    );

    observer.observe(gridRef);

    return () => {
      observer.disconnect();
    };
  }, [gridRef, page, hasMore, loading]);

  // Load initial products
  useEffect(() => {
    loadProducts(1);
  }, [category, search, featured]);

  return (
    <div className="lazy-product-grid-intersection">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <LazyProductCardWrapper
            key={product.id}
            product={product}
          />
        ))}
      </div>
      
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      )}
      
      {hasMore && (
        <div ref={setGridRef} className="h-4"></div>
      )}
      
      {!hasMore && products.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No more products to load
        </div>
      )}
    </div>
  );
}

'use client';

// import { optimizedGraphQLClient } from 'lib/graphql/optimized-client';
import { browserPrefetchManager } from 'lib/graphql/browser-prefetch-manager';
import { createHoverLazyLoader, createLazyComponent } from 'lib/lazy-loading/lazy-loader';
import { useState } from 'react';

// Lazy load category menu component
const LazyCategoryMenu = createLazyComponent(
  () => import('components/layout/search/collections'),
  {
    fallback: <CategoryMenuSkeleton />,
    threshold: 0.1,
    rootMargin: '100px',
  }
);

// Lazy load category products on hover
const HoverCategoryLoader = createHoverLazyLoader(
  async (categorySlug: string) => {
    return optimizedGraphQLClient.getProductsByCategory(categorySlug, 8, {
      page: 'product-list',
      userType: 'guest',
      device: 'desktop',
      priority: 'performance',
    });
  },
  { delay: 300 }
);

interface LazyCategoryMenuProps {
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
    count: number;
  }>;
  onCategoryHover?: (category: any) => void;
  onCategoryClick?: (category: any) => void;
}

export function LazyCategoryMenuWrapper({ 
  categories = [], 
  onCategoryHover, 
  onCategoryClick 
}: LazyCategoryMenuProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [prefetchedCategories, setPrefetchedCategories] = useState<Set<string>>(new Set());

  const handleCategoryHover = (category: any) => {
    setHoveredCategory(category.slug);
    onCategoryHover?.(category);

    // Prefetch category products if not already prefetched
    if (!prefetchedCategories.has(category.slug)) {
      browserPrefetchManager.addPrefetch({
        strategy: {
          name: `category_${category.slug}`,
          priority: 'medium',
          trigger: 'hover',
          delay: 200,
        },
        fetchFunction: () => optimizedGraphQLClient.getProductsByCategory(category.slug, 12, {
          page: 'product-list',
          userType: 'guest',
          device: 'desktop',
          priority: 'performance',
        }),
        cacheKey: `prefetch:category:${category.slug}`,
        ttl: 300,
      });
      setPrefetchedCategories(prev => new Set([...prev, category.slug]));
    }
  };

  const handleCategoryLeave = () => {
    setHoveredCategory(null);
  };

  const handleCategoryClick = (category: any) => {
    onCategoryClick?.(category);
  };

  return (
    <div className="lazy-category-menu">
      <LazyCategoryMenu
        categories={categories}
        onCategoryHover={handleCategoryHover}
        onCategoryLeave={handleCategoryLeave}
        onCategoryClick={handleCategoryClick}
        hoveredCategory={hoveredCategory}
      />
      
      {/* Show preview of category products on hover */}
      {hoveredCategory && (
        <HoverCategoryLoader>
          {(products, loading) => (
            <div className="category-preview">
              {loading && <div>Loading products...</div>}
              {products && products.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {products.slice(0, 4).map((product: any) => (
                    <div key={product.id} className="text-sm">
                      {product.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </HoverCategoryLoader>
      )}
    </div>
  );
}

// Lazy load categories with intersection observer
export function LazyCategoriesList() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesRef, setCategoriesRef] = useState<HTMLDivElement | null>(null);

  const loadCategories = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const categoriesData = await optimizedGraphQLClient.getCategories(20, {
        page: 'category',
        userType: 'guest',
        device: 'desktop',
        priority: 'performance',
      });
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!categoriesRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && categories.length === 0) {
            loadCategories();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(categoriesRef);

    return () => {
      observer.disconnect();
    };
  }, [categoriesRef, categories.length]);

  return (
    <div ref={setCategoriesRef} className="lazy-categories-list">
      {loading && <CategoryMenuSkeleton />}
      {categories.length > 0 && (
        <LazyCategoryMenuWrapper categories={categories} />
      )}
    </div>
  );
}

// Skeleton component for loading state
function CategoryMenuSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-4"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Import React for useEffect
import React from 'react';

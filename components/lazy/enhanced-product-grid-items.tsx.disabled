'use client';

import { browserPrefetchManager } from 'lib/graphql/browser-prefetch-manager';
import { WooCommerceProduct } from 'lib/woocommerce/types';
import { useEffect, useState } from 'react';
import { LazyProductCardWrapper } from './lazy-product-card';

interface EnhancedProductGridItemsProps {
  products: WooCommerceProduct[];
  enablePrefetching?: boolean;
  enableLazyLoading?: boolean;
}

export default function EnhancedProductGridItems({ 
  products, 
  enablePrefetching = true,
  enableLazyLoading = true 
}: EnhancedProductGridItemsProps) {
  const [visibleProducts, setVisibleProducts] = useState<WooCommerceProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with first few products for immediate display
  useEffect(() => {
    if (enableLazyLoading) {
      setVisibleProducts(products.slice(0, 6)); // Show first 6 products immediately
    } else {
      setVisibleProducts(products);
    }
  }, [products, enableLazyLoading]);

  // Lazy load more products as user scrolls
  useEffect(() => {
    if (!enableLazyLoading || visibleProducts.length >= products.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setLoading(true);
            // Simulate loading delay for demo
            setTimeout(() => {
              const currentCount = visibleProducts.length;
              const nextBatch = products.slice(currentCount, currentCount + 6);
              setVisibleProducts(prev => [...prev, ...nextBatch]);
              setLoading(false);
            }, 500);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
      }
    );

    // Observe the last product for infinite scroll
    const lastProduct = document.querySelector(`[data-product-index="${visibleProducts.length - 1}"]`);
    if (lastProduct) {
      observer.observe(lastProduct);
    }

    return () => observer.disconnect();
  }, [visibleProducts, products, enableLazyLoading]);

  // Prefetch product details on hover
  const handleProductHover = (product: WooCommerceProduct) => {
    if (!enablePrefetching) return;

    console.log(`[Prefetch] Hovering over product: ${product.name}`);
    
    browserPrefetchManager.addPrefetch({
      strategy: {
        name: `product_${product.slug}`,
        priority: 'medium',
        trigger: 'hover',
        delay: 200,
      },
      fetchFunction: async () => {
        // Simulate GraphQL call for product details
        console.log(`[Prefetch] Fetching details for: ${product.name}`);
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              images: product.images,
              description: `Detailed description for ${product.name}`,
            });
          }, 300);
        });
      },
      cacheKey: `prefetch:product:${product.slug}`,
      ttl: 300,
    });
  };

  return (
    <>
      {visibleProducts.map((product, index) => (
        <div
          key={product.slug}
          data-product-index={index}
          className="animate-fadeIn"
          onMouseEnter={() => handleProductHover(product)}
        >
          <LazyProductCardWrapper
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price || product.regular_price,
              regular_price: product.regular_price,
              sale_price: product.sale_price,
              on_sale: product.on_sale,
              images: product.images || [],
              stock_status: product.stock_status,
            }}
            onHover={() => handleProductHover(product)}
            onPrefetch={() => console.log(`[Prefetch] Prefetching: ${product.name}`)}
          />
        </div>
      ))}
      
      {loading && (
        <div className="col-span-full flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Loading more products...</span>
        </div>
      )}
      
      {visibleProducts.length < products.length && (
        <div className="col-span-full text-center py-4 text-gray-500">
          Showing {visibleProducts.length} of {products.length} products
        </div>
      )}
    </>
  );
}

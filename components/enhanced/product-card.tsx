'use client';

import { browserPrefetchManager } from 'lib/graphql/browser-prefetch-manager';
import { optimizedGraphQLClient } from 'lib/graphql/optimized-client';
import { GraphQLProduct } from 'lib/graphql/types';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface EnhancedProductCardProps {
  product: GraphQLProduct;
  enablePrefetching?: boolean;
  enableLazyLoading?: boolean;
  showPrefetchIndicator?: boolean;
  onHover?: (product: GraphQLProduct) => void;
  onPrefetch?: (product: GraphQLProduct) => void;
}

export default function EnhancedProductCard({
  product,
  enablePrefetching = true,
  enableLazyLoading = true,
  showPrefetchIndicator = false,
  onHover,
  onPrefetch,
}: EnhancedProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPrefetched, setIsPrefetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Lazy load image
  useEffect(() => {
    if (!enableLazyLoading || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageLoaded(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [enableLazyLoading]);

  // Prefetch on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(product);

    if (!enablePrefetching || isPrefetched) return;

    console.log(`[Prefetch] Hovering over product: ${product.name}`);
    
    browserPrefetchManager.addPrefetch({
      strategy: {
        name: `product_${product.slug}`,
        priority: 'medium',
        trigger: 'hover',
        delay: 200,
      },
      fetchFunction: async () => {
        setIsLoading(true);
        console.log(`[Prefetch] Fetching GraphQL details for: ${product.name}`);
        
        try {
          // Actually fetch GraphQL data
          const graphqlResult = await optimizedGraphQLClient.getProductBySlug(product.slug);
          const productDetails = graphqlResult.product;
          
          console.log(`[Prefetch] GraphQL data fetched for: ${product.name}`, {
            executionTime: graphqlResult.executionTime,
            optimizations: graphqlResult.optimizations
          });

          onPrefetch?.(product);
          setIsPrefetched(true);
          setIsLoading(false);
          
          return productDetails;
        } catch (error) {
          console.error(`[Prefetch] Failed to fetch GraphQL data for: ${product.name}`, error);
          setIsLoading(false);
          throw error;
        }
      },
      cacheKey: `prefetch:product:${product.slug}`,
      ttl: 300,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };


  return (
    <div
      ref={cardRef}
      className={`relative group transition-all duration-300 ${
        isHovered ? 'transform scale-105 shadow-lg' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={`/product/${product.slug}`}
        className="block"
        prefetch={false} // We handle prefetching manually
      >
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {enableLazyLoading && !imageLoaded ? (
            // Skeleton loader
            <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-gray-400 text-sm">Loading...</div>
            </div>
          ) : (
            <Image
              src={product.image?.sourceUrl || '/placeholder-image.svg'}
              alt={product.image?.altText || product.name}
              fill
              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              onLoad={() => setImageLoaded(true)}
            />
          )}
          
          {/* Sale badge */}
          {product.onSale && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Sale
            </div>
          )}
          
          {/* Stock status */}
          {product.stockStatus === 'OUT_OF_STOCK' && (
            <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded">
              Out of Stock
            </div>
          )}
          
          {/* Prefetch indicator */}
          {showPrefetchIndicator && (
            <div className="absolute bottom-2 right-2">
              {isLoading && (
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  Prefetching
                </div>
              )}
              {isPrefetched && !isLoading && (
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                  ✓ Cached
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-3 space-y-1">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          
          <div className="flex items-center space-x-2">
            {product.onSale && product.salePrice ? (
              <>
                <span className="text-lg font-bold text-red-600">
                  {product.salePrice}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {product.regularPrice}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                {product.price || product.regularPrice}
              </span>
            )}
          </div>
          
          {/* Hover indicator */}
          {isHovered && (
            <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Hover to prefetch details
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

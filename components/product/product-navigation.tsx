'use client';

import { BlurImage } from 'components/blur-image';
import { WooCommerceProduct } from 'lib/woocommerce/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ProductNavigationProps {
  currentProductId: number;
  relatedProducts: WooCommerceProduct[];
}

export function ProductNavigation({ currentProductId, relatedProducts }: ProductNavigationProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateToProduct = async (slug: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      // Use Next.js router for client-side navigation
      router.push(`/product/${slug}`);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => setIsNavigating(false), 500);
    }
  };

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {relatedProducts
          .filter(product => product.id !== currentProductId)
          .slice(0, 4)
          .map((product) => (
            <li
              key={product.id}
              className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
            >
              <button
                onClick={() => navigateToProduct(product.slug)}
                className="relative h-full w-full group"
                disabled={isNavigating}
              >
                <div className="aspect-square overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75 relative">
                  {isNavigating ? (
                    // Skeleton loading state - maintains layout
                    <div className="h-full w-full bg-gray-200 animate-pulse flex items-center justify-center transition-opacity duration-300">
                      <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  ) : product.images?.[0] ? (
                    <BlurImage
                      src={product.images[0].src}
                      alt={product.images[0].alt || product.name}
                      width={300}
                      height={300}
                      className="object-cover object-center fade-in-scale"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center transition-opacity duration-300">
                      <span className="text-gray-500 text-sm">No Image</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-left">
                  {isNavigating ? (
                    // Skeleton for text content
                    <div className="space-y-1 transition-opacity duration-300">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  ) : (
                    <div className="fade-in-up">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ${product.price || product.regular_price}
                      </p>
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

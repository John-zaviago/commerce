'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProductLoadingWrapperProps {
  children: React.ReactNode;
}

export function ProductLoadingWrapper({ children }: ProductLoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsLoading(true);
    };

    const handleRouteChangeComplete = () => {
      setIsLoading(false);
    };

    // Listen for route changes
    const originalPush = router.push;
    router.push = (...args) => {
      setIsLoading(true);
      return originalPush.apply(router, args);
    };

    // Clean up
    return () => {
      router.push = originalPush;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8 animate-in fade-in duration-300">
        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
          {/* Gallery Skeleton */}
          <div className="h-full w-full basis-full lg:basis-4/6">
            <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden">
              <div className="h-full w-full bg-gray-200 animate-pulse rounded-md transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="basis-full lg:basis-2/6">
            <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
              {/* Title Skeleton */}
              <div className="h-12 bg-gray-200 rounded animate-pulse mb-4 transition-opacity duration-300"></div>
              {/* Price Skeleton */}
              <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse transition-opacity duration-300"></div>
            </div>
            
            {/* Description Skeleton */}
            <div className="space-y-3 mb-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse transition-opacity duration-300"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6 transition-opacity duration-300"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6 transition-opacity duration-300"></div>
            </div>

            {/* Add to Cart Button Skeleton */}
            <div className="h-12 bg-gray-200 rounded-full animate-pulse transition-opacity duration-300"></div>
          </div>
        </div>

        {/* Related Products Skeleton */}
        <div className="py-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4 transition-opacity duration-300"></div>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5">
                <div className="aspect-square bg-gray-200 rounded-md animate-pulse transition-opacity duration-300"></div>
                <div className="mt-2 space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse transition-opacity duration-300"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3 transition-opacity duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

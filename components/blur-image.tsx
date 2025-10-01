'use client';

import { clsx } from 'clsx';
import type { ImageProps as NextImageProps } from 'next/image';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// Global array to track loaded images across navigation
let loadedImages: string[] = [];

/**
 * Custom hook to track image loaded state and avoid re-blur on navigation
 * Uses pathname + src as unique identifier to persist load state per page
 */
function useImageLoadedState(src: string) {
  const pathname = usePathname();
  const uniqueImagePath = pathname + '__' + src;
  
  const [loaded, setLoaded] = useState(() => loadedImages.includes(uniqueImagePath));
  
  return [
    loaded,
    () => {
      if (loaded) return;
      loadedImages.push(uniqueImagePath);
      setLoaded(true);
    },
  ] as const;
}

export interface BlurImageProps extends Omit<NextImageProps, 'src' | 'priority'> {
  src: string;
  containerClassName?: string;
}

/**
 * Advanced image component with blur loading effect
 * Features:
 * - Smooth blur-to-clear transition with custom easing
 * - Persistent load tracking (won't re-blur on navigation)
 * - Pulse animation while loading
 * - Automatic priority handling based on loading prop
 */
export function BlurImage(props: BlurImageProps) {
  const { 
    alt, 
    src, 
    loading = 'lazy', 
    style, 
    className, 
    containerClassName,
    ...rest 
  } = props;
  
  const [loaded, onLoad] = useImageLoadedState(src);

  return (
    <div
      className={clsx(
        'blur-image-container overflow-hidden',
        !loaded && 'animate-pulse [animation-duration:4s]',
        containerClassName
      )}
    >
      <NextImage
        className={clsx(
          // Custom cubic-bezier easing for smooth transition
          '[transition:filter_500ms_cubic-bezier(.4,0,.2,1)]',
          'h-full max-h-full w-full',
          loaded ? 'blur-0' : 'blur-xl',
          className
        )}
        src={src}
        alt={alt}
        style={{ objectFit: 'cover', ...style }}
        loading={loading}
        priority={loading === 'eager'}
        onLoad={onLoad}
        {...rest}
      />
    </div>
  );
}

/**
 * Utility function to clear loaded images cache
 * Useful for testing or manual cache invalidation
 */
export function clearLoadedImagesCache() {
  loadedImages = [];
}


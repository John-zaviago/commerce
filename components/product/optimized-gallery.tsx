'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { GridTileImage } from 'components/grid/tile';
import { useProduct } from 'components/product/product-context';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface OptimizedGalleryProps {
  images: { src: string; altText: string }[];
}

export function OptimizedGallery({ images }: OptimizedGalleryProps) {
  const { state } = useProduct();
  
  // Use local state for image switching to avoid URL updates and page reloads
  const [localImageIndex, setLocalImageIndex] = useState(() => {
    return state.image ? parseInt(state.image) : 0;
  });

  // Sync with URL state on initial load
  useEffect(() => {
    if (state.image) {
      setLocalImageIndex(parseInt(state.image));
    }
  }, [state.image]);

  const imageIndex = localImageIndex;
  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex = imageIndex === 0 ? images.length - 1 : imageIndex - 1;

  // Robust image preloading using fetch API
  useEffect(() => {
    const preloadImages = async () => {
      const preloadPromises = [];
      
      // Preload next and previous images
      if (images[nextImageIndex]) {
        preloadPromises.push(
          fetch(images[nextImageIndex].src, { method: 'HEAD' })
            .catch(() => {}) // Ignore errors
        );
      }
      
      if (images[previousImageIndex]) {
        preloadPromises.push(
          fetch(images[previousImageIndex].src, { method: 'HEAD' })
            .catch(() => {}) // Ignore errors
        );
      }

      // Execute all preloads in parallel
      await Promise.allSettled(preloadPromises);
    };

    preloadImages();
  }, [imageIndex, images, nextImageIndex, previousImageIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setLocalImageIndex(previousImageIndex);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setLocalImageIndex(nextImageIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextImageIndex, previousImageIndex]);

  // Smooth image transition handlers
  const handlePreviousImage = useCallback(() => {
    setLocalImageIndex(previousImageIndex);
  }, [previousImageIndex]);

  const handleNextImage = useCallback(() => {
    setLocalImageIndex(nextImageIndex);
  }, [nextImageIndex]);

  const handleThumbnailClick = useCallback((index: number) => {
    setLocalImageIndex(index);
  }, []);

  const buttonClassName =
    'h-full px-6 transition-all ease-in-out hover:scale-110 hover:text-black dark:hover:text-white flex items-center justify-center';

  return (
    <div className="gallery-container">
      {/* Main Image Display */}
      <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden rounded-lg">
        {images[imageIndex] && (
          <Image
            className="h-full w-full object-contain transition-all duration-300 ease-in-out"
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            alt={images[imageIndex]?.altText as string}
            src={images[imageIndex]?.src as string}
            priority={imageIndex === 0}
            loading={imageIndex === 0 ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <div className="absolute bottom-[15%] flex w-full justify-center">
            <div className="mx-auto flex h-11 items-center rounded-full border border-white bg-neutral-50/80 text-neutral-500 backdrop-blur-sm dark:border-black dark:bg-neutral-900/80">
              <button
                onClick={handlePreviousImage}
                aria-label="Previous product image"
                className={buttonClassName}
                type="button"
              >
                <ArrowLeftIcon className="h-5" />
              </button>
              <div className="mx-1 h-6 w-px bg-neutral-500"></div>
              <button
                onClick={handleNextImage}
                aria-label="Next product image"
                className={buttonClassName}
                type="button"
              >
                <ArrowRightIcon className="h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur-sm">
            {imageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="mt-4">
          <ul className="flex items-center justify-center gap-2 overflow-auto py-1">
            {images.map((image, index) => {
              const isActive = index === imageIndex;

              return (
                <li key={`${image.src}-${index}`} className="h-20 w-20 flex-shrink-0">
                  <button
                    onClick={() => handleThumbnailClick(index)}
                    aria-label={`Select product image ${index + 1}`}
                    className={`h-full w-full transition-all duration-200 ease-in-out rounded-md overflow-hidden ${
                      isActive 
                        ? 'ring-2 ring-blue-500 ring-offset-2' 
                        : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2'
                    }`}
                    type="button"
                  >
                    <GridTileImage
                      alt={image.altText}
                      src={image.src}
                      width={80}
                      height={80}
                      active={isActive}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Keyboard Navigation Hint */}
      {images.length > 1 && (
        <div className="mt-2 text-center text-xs text-gray-500">
          Use ← → arrow keys to navigate images
        </div>
      )}
    </div>
  );
}

'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { BlurImage } from 'components/blur-image';
import { GridTileImage } from 'components/grid/tile';
import { useProduct, useUpdateURL } from 'components/product/product-context';
import { useEffect, useState } from 'react';

export function Gallery({ images }: { images: { src: string; altText: string }[] }) {
  const { state, updateImage } = useProduct();
  const updateURL = useUpdateURL();
  
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

  // Preload next and previous images for smoother transitions
  useEffect(() => {
    const preloadImages = () => {
      // Use HTMLImageElement instead of Image to avoid conflict with Next.js Image
      const nextImg = new window.Image();
      const prevImg = new window.Image();
      
      if (images[nextImageIndex]) {
        nextImg.src = images[nextImageIndex].src;
      }
      if (images[previousImageIndex]) {
        prevImg.src = images[previousImageIndex].src;
      }
    };

    preloadImages();
  }, [imageIndex, images, nextImageIndex, previousImageIndex]);

  const imageIndex = localImageIndex;

  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex = imageIndex === 0 ? images.length - 1 : imageIndex - 1;

  const buttonClassName =
    'h-full px-6 transition-all ease-in-out hover:scale-110 hover:text-black dark:hover:text-white flex items-center justify-center';

  return (
    <div>
        <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden">
          {images[imageIndex] && (
            <BlurImage
              className="object-contain"
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              alt={images[imageIndex]?.altText as string}
              src={images[imageIndex]?.src as string}
              loading={imageIndex === 0 ? "eager" : "lazy"}
            />
          )}

        {images.length > 1 ? (
          <div className="absolute bottom-[15%] flex w-full justify-center">
            <div className="mx-auto flex h-11 items-center rounded-full border border-white bg-neutral-50/80 text-neutral-500 backdrop-blur-sm dark:border-black dark:bg-neutral-900/80">
              <button
                onClick={() => {
                  setLocalImageIndex(previousImageIndex);
                }}
                aria-label="Previous product image"
                className={buttonClassName}
                type="button"
              >
                <ArrowLeftIcon className="h-5" />
              </button>
              <div className="mx-1 h-6 w-px bg-neutral-500"></div>
              <button
                onClick={() => {
                  setLocalImageIndex(nextImageIndex);
                }}
                aria-label="Next product image"
                className={buttonClassName}
                type="button"
              >
                <ArrowRightIcon className="h-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

        {images.length > 1 ? (
          <ul className="my-12 flex items-center flex-wrap justify-center gap-2 overflow-auto py-1 lg:mb-0">
            {images.map((image, index) => {
              const isActive = index === imageIndex;

              return (
                <li key={image.src} className="h-20 w-20">
                  <button
                    onClick={() => {
                      setLocalImageIndex(index);
                    }}
                    aria-label="Select product image"
                    className="h-full w-full transition-opacity duration-200 ease-in-out"
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
        ) : null}
    </div>
  );
}

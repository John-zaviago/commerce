import React, { Suspense, useEffect, useRef, useState } from 'react';

export interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  fallback?: React.ReactNode;
}

export interface LazyLoadState {
  isVisible: boolean;
  hasLoaded: boolean;
  isLoading: boolean;
}

/**
 * Hook for lazy loading with Intersection Observer
 */
export function useLazyLoad(options: LazyLoadOptions = {}): [React.RefObject<HTMLElement>, LazyLoadState] {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [state, setState] = useState<LazyLoadState>({
    isVisible: false,
    hasLoaded: false,
    isLoading: false
  });

  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setState(prev => ({
              ...prev,
              isVisible: true,
              hasLoaded: true,
              isLoading: true
            }));

            if (triggerOnce) {
              observer.unobserve(element);
            }
          } else if (!triggerOnce) {
            setState(prev => ({
              ...prev,
              isVisible: false
            }));
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [elementRef, state];
}

/**
 * Lazy load component with Suspense
 */
export function LazyComponent<T extends React.ComponentType<any>>({
  component,
  fallback,
  ...props
}: {
  component: () => Promise<{ default: T }>;
  fallback?: React.ReactNode;
} & React.ComponentProps<T>): React.ReactElement {
  const LazyComponent = React.lazy(component);
  const fallbackElement = fallback || React.createElement('div', { className: 'animate-pulse bg-gray-200 rounded h-32' });

  return React.createElement(
    Suspense,
    { fallback: fallbackElement },
    React.createElement(LazyComponent, props)
  );
}

/**
 * Lazy load image component
 */
export function LazyImage({
  src,
  alt,
  className = '',
  fallback,
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
} & React.ImgHTMLAttributes<HTMLImageElement>): React.ReactElement {
  const [elementRef, { isVisible, hasLoaded }] = useLazyLoad({
    threshold: 0.1,
    rootMargin: '100px'
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isVisible && !imageLoaded && !imageError) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = src;
    }
  }, [isVisible, src, imageLoaded, imageError]);

  if (!hasLoaded) {
    const fallbackElement = fallback || React.createElement('div', { className: 'animate-pulse bg-gray-200 rounded' });
    return React.createElement('div', { ref: elementRef }, fallbackElement);
  }

  if (imageError) {
    return React.createElement(
      'div',
      { className: `${className} bg-gray-200 flex items-center justify-center` },
      React.createElement('span', { className: 'text-gray-500 text-sm' }, 'Failed to load')
    );
  }

  return React.createElement('img', {
    ref: elementRef,
    src,
    alt,
    className: `${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    onLoad: () => setImageLoaded(true),
    onError: () => setImageError(true),
    ...props
  });
}

/**
 * Lazy load product card
 */
export function LazyProductCard({
  product,
  onLoad,
  ...props
}: {
  product: any;
  onLoad?: () => void;
} & React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  const [elementRef, { isVisible, hasLoaded }] = useLazyLoad({
    threshold: 0.1,
    rootMargin: '200px'
  });

  useEffect(() => {
    if (isVisible && onLoad) {
      onLoad();
    }
  }, [isVisible, onLoad]);

  if (!hasLoaded) {
    return React.createElement('div', {
      ref: elementRef,
      className: 'animate-pulse bg-gray-200 rounded-lg h-64'
    });
  }

  return React.createElement(
    'div',
    { ref: elementRef, className: 'product-card', ...props },
    React.createElement(LazyImage, {
      src: product.image?.src || '/placeholder.jpg',
      alt: product.name,
      className: 'w-full h-48 object-cover rounded-lg'
    }),
    React.createElement(
      'div',
      { className: 'p-4' },
      React.createElement('h3', { className: 'font-semibold text-lg' }, product.name),
      React.createElement('p', { className: 'text-gray-600' }, `$${product.price}`)
    )
  );
}

/**
 * Lazy load grid component
 */
export function LazyGrid({
  items,
  renderItem,
  fallback,
  className = '',
  ...props
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  const [elementRef, { isVisible, hasLoaded }] = useLazyLoad({
    threshold: 0.1,
    rootMargin: '300px'
  });

  if (!hasLoaded) {
    const skeletonItems = Array.from({ length: 6 }).map((_, index) =>
      React.createElement('div', {
        key: index,
        className: 'animate-pulse bg-gray-200 rounded-lg h-64'
      })
    );

    return React.createElement(
      'div',
      {
        ref: elementRef,
        className: `${className} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
      },
      ...skeletonItems
    );
  }

  const gridItems = items.map((item, index) =>
    React.createElement(
      'div',
      { key: item.id || index },
      renderItem(item, index)
    )
  );

  return React.createElement(
    'div',
    {
      ref: elementRef,
      className: `${className} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`,
      ...props
    },
    ...gridItems
  );
}

/**
 * Lazy load with prefetching
 */
export function LazyLoadWithPrefetch({
  children,
  prefetchFunction,
  threshold = 0.3,
  rootMargin = '200px',
  ...props
}: {
  children: React.ReactNode;
  prefetchFunction?: () => void;
  threshold?: number;
  rootMargin?: string;
} & React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  const [elementRef, { isVisible }] = useLazyLoad({
    threshold,
    rootMargin,
    triggerOnce: false
  });

  useEffect(() => {
    if (isVisible && prefetchFunction) {
      prefetchFunction();
    }
  }, [isVisible, prefetchFunction]);

  return React.createElement(
    'div',
    { ref: elementRef, ...props },
    children
  );
}
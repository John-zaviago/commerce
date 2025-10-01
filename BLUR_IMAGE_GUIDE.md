# Advanced Blur Image Loading Effect

A sophisticated image loading component with smooth blur-to-clear transitions and persistent load tracking across navigation.

## Features

✅ **Smooth Blur Effect** - Images start blurred and smoothly transition to clear when loaded  
✅ **Custom Easing** - Uses `cubic-bezier(.4,0,.2,1)` for professional-grade transitions  
✅ **Persistent Load Tracking** - Images won't re-blur when navigating back to previously visited pages  
✅ **Pulse Animation** - Container pulses while image is loading  
✅ **Automatic Priority** - Handles `priority` prop based on loading strategy  
✅ **TypeScript Support** - Full type safety with Next.js Image props  

## Implementation

Based on this excellent guide: [How to create an image with blurry loading effect in NextJS](https://www.leohuynh.dev/blog/how-to-create-an-image-with-blurry-loading-effect-in-nextjs)

## Usage

### Basic Usage

```tsx
import { BlurImage } from 'components/blur-image';

<BlurImage
  src="/path/to/image.jpg"
  alt="Product image"
  width={500}
  height={500}
  loading="lazy"
/>
```

### With Fill Layout

```tsx
<div className="relative aspect-square w-full">
  <BlurImage
    src="/path/to/image.jpg"
    alt="Product image"
    fill
    sizes="(min-width: 1024px) 66vw, 100vw"
    className="object-cover"
  />
</div>
```

### Eager Loading (Above the Fold)

```tsx
<BlurImage
  src="/hero-image.jpg"
  alt="Hero banner"
  width={1200}
  height={600}
  loading="eager" // Will set priority={true} automatically
/>
```

### Custom Container Styling

```tsx
<BlurImage
  src="/product.jpg"
  alt="Product"
  width={400}
  height={400}
  containerClassName="rounded-lg shadow-xl" // Styles the wrapper div
  className="object-contain" // Styles the image itself
/>
```

## How It Works

### 1. **Load State Tracking**
```tsx
// Global array tracks loaded images per page
let loadedImages: string[] = [];

// Unique identifier: pathname + image src
const uniqueImagePath = pathname + '__' + src;
```

### 2. **Blur Transition**
```tsx
// Custom transition with smooth easing
className={clsx(
  '[transition:filter_500ms_cubic-bezier(.4,0,.2,1)]',
  loaded ? 'blur-0' : 'blur-xl'
)}
```

### 3. **Pulse Animation**
```tsx
// Container pulses while loading (4s duration)
containerClassName={clsx(
  !loaded && 'animate-pulse [animation-duration:4s]'
)}
```

### 4. **Load Detection**
```tsx
// Triggered when image finishes loading
onLoad={() => {
  if (!loaded) {
    loadedImages.push(uniqueImagePath);
    setLoaded(true);
  }}
/>
```

## Updated Components

The following components now use `BlurImage`:

- ✅ `components/product/gallery.tsx` - Main product gallery
- ✅ `components/woocommerce/product-card.tsx` - Product cards
- ✅ `components/product/product-navigation.tsx` - Related products

## Performance Benefits

1. **Better UX** - Smooth visual feedback while images load
2. **Perceived Performance** - Users see instant feedback with blur effect
3. **No Re-renders** - Images that were already loaded won't blur again
4. **Optimized Transitions** - GPU-accelerated CSS transitions
5. **No Extra Requests** - Unlike placeholder images, no additional network calls

## Customization

### Change Blur Intensity

Modify the blur classes:
```tsx
loaded ? 'blur-0' : 'blur-2xl' // More intense blur
loaded ? 'blur-0' : 'blur-sm'  // Subtle blur
```

### Adjust Transition Duration

```tsx
'[transition:filter_700ms_cubic-bezier(.4,0,.2,1)]' // Slower
'[transition:filter_300ms_cubic-bezier(.4,0,.2,1)]' // Faster
```

### Different Easing Functions

```tsx
'cubic-bezier(.4,0,.2,1)'     // Default (ease-in-out)
'cubic-bezier(0,0,.2,1)'      // Ease-out
'cubic-bezier(.4,0,1,1)'      // Ease-in
'ease-in-out'                 // Standard
```

### Add Scale Effect

```tsx
className={clsx(
  '[transition:filter_500ms_cubic-bezier(.4,0,.2,1),transform_500ms_cubic-bezier(.4,0,.2,1)]',
  loaded ? 'blur-0 scale-100' : 'blur-xl scale-105'
)}
```

## Utility Functions

### Clear Cache (for testing)

```tsx
import { clearLoadedImagesCache } from 'components/blur-image';

// Clear all loaded images from memory
clearLoadedImagesCache();
```

## Props

All standard Next.js `Image` props are supported, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | required | Image source URL |
| `alt` | `string` | required | Alt text |
| `containerClassName` | `string` | `undefined` | Additional classes for wrapper div |
| `className` | `string` | `undefined` | Additional classes for image |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Loading strategy |
| `...rest` | `ImageProps` | - | All other Next.js Image props |

## Browser Support

- ✅ All modern browsers
- ✅ Safari (iOS & macOS)
- ✅ Chrome/Edge
- ✅ Firefox
- ⚠️ IE11 (graceful degradation - no blur effect)

## Credits

Implementation inspired by [Leo Huynh's guide](https://www.leohuynh.dev/blog/how-to-create-an-image-with-blurry-loading-effect-in-nextjs)


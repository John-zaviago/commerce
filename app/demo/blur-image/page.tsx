'use client';

import { BlurImage, clearLoadedImagesCache } from 'components/blur-image';
import { useState } from 'react';

export default function BlurImageDemo() {
  const [imageKey, setImageKey] = useState(0);

  // Sample images from various sources
  const sampleImages = [
    {
      src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      alt: 'Black headphones',
    },
    {
      src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
      alt: 'Watch on table',
    },
    {
      src: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
      alt: 'Sunglasses',
    },
    {
      src: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&h=500&fit=crop',
      alt: 'White sneakers',
    },
  ];

  const handleClearCache = () => {
    clearLoadedImagesCache();
    // Force re-render by changing key
    setImageKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Blur Image Loading Effect
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Watch images smoothly transition from blurred to clear. Navigate away and back - 
            they won't blur again thanks to persistent load tracking!
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={handleClearCache}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Cache & Reload Images
          </button>
          <a
            href="#features"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            View Features
          </a>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" key={imageKey}>
          {sampleImages.map((image, index) => (
            <div key={image.src} className="space-y-2">
              <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <BlurImage
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">{image.alt}</p>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div id="features" className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smooth Blur Effect</h3>
                  <p className="text-gray-600 text-sm">Images start blurred and smoothly transition to clear</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Custom Easing</h3>
                  <p className="text-gray-600 text-sm">Uses cubic-bezier(.4,0,.2,1) for professional transitions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Persistent Load Tracking</h3>
                  <p className="text-gray-600 text-sm">Images won't re-blur when navigating back</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pulse Animation</h3>
                  <p className="text-gray-600 text-sm">Container pulses while image is loading</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">TypeScript Support</h3>
                  <p className="text-gray-600 text-sm">Full type safety with Next.js Image props</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Zero Extra Requests</h3>
                  <p className="text-gray-600 text-sm">No additional network calls for placeholders</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-gray-900 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Usage Example</h2>
          <pre className="text-green-400 overflow-x-auto">
            <code>{`import { BlurImage } from 'components/blur-image';

<BlurImage
  src="/product-image.jpg"
  alt="Product"
  width={500}
  height={500}
  loading="lazy"
/>`}</code>
          </pre>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Test It Out!</h2>
          <ol className="space-y-3 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Watch the images load with a smooth blur-to-clear transition</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Navigate to another page (like the home page)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Come back to this demo - notice images appear instantly without blur!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Click "Clear Cache & Reload" to see the blur effect again</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}


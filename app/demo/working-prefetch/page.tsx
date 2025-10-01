'use client';

import { useState, useEffect } from 'react';
import { optimizedGraphQLClient } from 'lib/graphql/optimized-client';
import { graphqlPrefetchManager } from 'lib/graphql/prefetch-manager';
import { LazyImage, LazyProductCard, LazyGrid } from 'lib/lazy-loading/lazy-loader';

export default function WorkingPrefetchDemo() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [prefetchStats, setPrefetchStats] = useState<any>(null);

  useEffect(() => {
    loadProducts();
    updateStats();
    
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Simulate product data
      const mockProducts = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        slug: `product-${i + 1}`,
        price: `$${(Math.random() * 100 + 10).toFixed(2)}`,
        image: {
          src: `https://picsum.photos/400/400?random=${i + 1}`,
          alt: `Product ${i + 1}`
        },
        onSale: Math.random() > 0.7
      }));

      setProducts(mockProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = async () => {
    try {
      const [clientStats, prefetchStats] = await Promise.all([
        optimizedGraphQLClient.getStats(),
        Promise.resolve(graphqlPrefetchManager.getStats())
      ]);

      setStats(clientStats);
      setPrefetchStats(prefetchStats);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const handleProductHover = (product: any) => {
    // Prefetch product details on hover
    graphqlPrefetchManager.prefetchProduct(product.slug, {
      priority: 'high',
      trigger: 'hover',
      delay: 100
    });
  };

  const testOptimizations = async () => {
    try {
      console.log('Testing all optimizations...');
      
      // Test Redis caching
      const cacheResult = await optimizedGraphQLClient.request(`
        query TestCache {
          generalSettings {
            title
          }
        }
      `, {}, { useCache: true });
      
      console.log('Cache test result:', cacheResult);

      // Test field optimization
      const optimizedResult = await optimizedGraphQLClient.request(`
        query TestOptimization {
          products(first: 3) {
            nodes {
              id
              name
              slug
              price
              image { sourceUrl altText }
            }
          }
        }
      `, {}, { 
        useFieldOptimization: true,
        context: { component: 'product-grid' }
      });
      
      console.log('Optimization test result:', optimizedResult);

      // Test batching
      const batchResult = await optimizedGraphQLClient.batchRequest([
        {
          query: `query Test1 { generalSettings { title } }`,
          options: { useCache: true }
        },
        {
          query: `query Test2 { generalSettings { description } }`,
          options: { useCache: true }
        }
      ]);
      
      console.log('Batch test result:', batchResult);

    } catch (error) {
      console.error('Optimization test error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Working Prefetch & Lazy Loading Demo
          </h1>
          <p className="text-gray-600 mb-6">
            This demo showcases all optimization features working together.
          </p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={testOptimizations}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Test All Optimizations
            </button>
            <button
              onClick={loadProducts}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Reload Products
            </button>
          </div>
        </div>

        {/* Stats Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Cache Stats</h3>
            <div className="text-sm text-gray-600">
              <p>Connected: {stats?.cache?.connected ? '✅' : '❌'}</p>
              <p>Total Keys: {stats?.cache?.totalKeys || 0}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Batch Stats</h3>
            <div className="text-sm text-gray-600">
              <p>Queue Length: {stats?.batch?.queueLength || 0}</p>
              <p>Processing: {stats?.batch?.isProcessing ? '✅' : '❌'}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Prefetch Stats</h3>
            <div className="text-sm text-gray-600">
              <p>Queue: {prefetchStats?.queueLength || 0}</p>
              <p>Executed: {prefetchStats?.executedCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Lazy Loading Demo */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Lazy Loading Demo</h2>
          <p className="text-gray-600 mb-4">
            Scroll down to see lazy loading in action. Images and components load as they come into view.
          </p>
          
          <LazyGrid
            items={products}
            renderItem={(product, index) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                onMouseEnter={() => handleProductHover(product)}
              >
                <LazyImage
                  src={product.image.src}
                  alt={product.image.alt}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-2">{product.price}</p>
                  {product.onSale && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                      On Sale
                    </span>
                  )}
                </div>
              </div>
            )}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          />
        </div>

        {/* Prefetch Demo */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Prefetch Demo</h2>
          <p className="text-gray-600 mb-4">
            Hover over the products below to trigger prefetching. Check the console for prefetch logs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map((product) => (
              <div
                key={product.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                onMouseEnter={() => handleProductHover(product)}
              >
                <LazyImage
                  src={product.image.src}
                  alt={product.image.alt}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-gray-600">{product.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">How to Test:</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Scroll down to see lazy loading in action</li>
            <li>Hover over products to trigger prefetching</li>
            <li>Click "Test All Optimizations" to run performance tests</li>
            <li>Check browser console for detailed logs</li>
            <li>Monitor the stats cards for real-time updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
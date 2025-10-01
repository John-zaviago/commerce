
import ProductRecommendations from 'components/enhanced/product-recommendations';
import { optimizedGraphQLClient } from 'lib/graphql/optimized-client';
import ProductGridClient from './product-grid-client';

export const metadata = {
  title: 'Home',
  description: 'High-performance ecommerce store built with Next.js, Vercel, and WooCommerce.',
  openGraph: {
    type: 'website'
  }
};

export default async function HomePage() {
  // Use GraphQL to fetch homepage data with optimizations
  const homepageData = await optimizedGraphQLClient.getHomepageData();
  const products = homepageData.products;

  return (
    <div>
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome to Our WooCommerce Store
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover our amazing collection of products, powered by WooCommerce.
          </p>
        </div>
      </div>
      
      {/* Enhanced Product Grid with GraphQL */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-8">
            Featured Products
          </h2>
          <ProductGridClient products={products} />
        </div>
      </div>
      
      {/* Product Recommendations */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProductRecommendations
            category="electronics"
            limit={6}
            enablePrefetching={true}
            enableLazyLoading={true}
            showPrefetchIndicator={true}
            title="Recommended for You"
          />
        </div>
      </div>
    </div>
  );
}

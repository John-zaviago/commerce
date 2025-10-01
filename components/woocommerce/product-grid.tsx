import { WooCommerceProduct } from 'lib/woocommerce/types';
import { WooCommerceProductCard } from './product-card';

interface ProductGridProps {
  products: WooCommerceProduct[];
  title?: string;
}

export function WooCommerceProductGrid({ products, title }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {title && (
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        </div>
      )}
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <WooCommerceProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

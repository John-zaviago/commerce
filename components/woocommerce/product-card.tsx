import { BlurImage } from 'components/blur-image';
import { WooCommerceProduct } from 'lib/woocommerce/types';
import Link from 'next/link';

interface ProductCardProps {
  product: WooCommerceProduct;
}

export function WooCommerceProductCard({ product }: ProductCardProps) {
  const featuredImage = product.images?.[0];
  const price = product.on_sale && product.sale_price ? product.sale_price : product.price;
  const regularPrice = product.regular_price;
  const isOnSale = product.on_sale && product.sale_price;

  return (
    <div className="group relative">
      <div className="aspect-square overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
        {featuredImage ? (
          <BlurImage
            src={featuredImage.src}
            alt={featuredImage.alt || product.name}
            width={300}
            height={300}
            className="object-cover object-center lg:h-full lg:w-full"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-between">
        <div>
          <h3 className="text-sm text-gray-700">
            <Link href={`/product/${product.slug}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {product.short_description || product.description}
          </p>
        </div>
        <div className="text-right">
          {isOnSale ? (
            <div>
              <p className="text-sm font-medium text-gray-900">${price}</p>
              <p className="text-sm text-gray-500 line-through">${regularPrice}</p>
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-900">${price}</p>
          )}
        </div>
      </div>
      <div className="mt-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          product.stock_status === 'instock' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
    </div>
  );
}

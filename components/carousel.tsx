import { getWooCommerceProducts } from 'lib/woocommerce/index';
import Link from 'next/link';
import { GridTileImage } from './grid/tile';

export async function Carousel() {
  try {
    // Get products for carousel from WooCommerce
    const products = await getWooCommerceProducts({ per_page: 6 });
    console.log('Carousel products fetched:', products.length);

    if (!products?.length) return null;

    // Purposefully duplicating products to make the carousel loop and not run out of products on wide screens.
    const carouselProducts = [...products, ...products, ...products];

    return (
      <div className="w-full overflow-x-auto pb-6 pt-1">
        <ul className="flex animate-carousel gap-4">
          {carouselProducts.map((product, i) => (
            <li
              key={`${product.handle}${i}`}
              className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3"
            >
              <Link href={`/product/${product.handle}`} className="relative h-full w-full">
                <GridTileImage
                  alt={product.title}
                  label={{
                    title: product.title,
                    amount: product.priceRange.maxVariantPrice.amount,
                    currencyCode: product.priceRange.maxVariantPrice.currencyCode
                  }}
                  src={product.featuredImage?.url}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    console.error('Error in Carousel:', error);
    return (
      <div className="w-full overflow-x-auto pb-6 pt-1">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }
}

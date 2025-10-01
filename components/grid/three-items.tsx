import { GridTileImage } from 'components/grid/tile';
import type { Product } from 'lib/shopify/types';
import { getWooCommerceHomepageProducts } from 'lib/woocommerce/index';
import Link from 'next/link';

function ThreeItemGridItem({
  item,
  size,
  priority
}: {
  item: Product;
  size: 'full' | 'half';
  priority?: boolean;
}) {
  return (
    <div
      className={size === 'full' ? 'md:col-span-4 md:row-span-2' : 'md:col-span-2 md:row-span-1'}
    >
      <Link
        className="relative block aspect-square h-full w-full"
        href={`/product/${item.handle}`}
        prefetch={true}
      >
        <GridTileImage
          src={item.featuredImage.url}
          fill
          sizes={
            size === 'full' ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'
          }
          priority={priority}
          alt={item.title}
          label={{
            position: size === 'full' ? 'center' : 'bottom',
            title: item.title as string,
            amount: item.priceRange.maxVariantPrice.amount,
            currencyCode: item.priceRange.maxVariantPrice.currencyCode
          }}
        />
      </Link>
    </div>
  );
}

export async function ThreeItemGrid() {
  try {
    // Get featured products from WooCommerce
    const homepageItems = await getWooCommerceHomepageProducts();
    console.log('Homepage items fetched:', homepageItems.length);

    if (!homepageItems[0] || !homepageItems[1] || !homepageItems[2]) {
      console.log('Not enough products for three-item grid');
      return null;
    }

    const [firstProduct, secondProduct, thirdProduct] = homepageItems;

    return (
      <section className="mx-auto grid max-w-(--breakpoint-2xl) gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
        <ThreeItemGridItem size="full" item={firstProduct} priority={true} />
        <ThreeItemGridItem size="half" item={secondProduct} priority={true} />
        <ThreeItemGridItem size="half" item={thirdProduct} />
      </section>
    );
  } catch (error) {
    console.error('Error in ThreeItemGrid:', error);
    return (
      <section className="mx-auto grid max-w-(--breakpoint-2xl) gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
        <div className="col-span-full text-center py-8">
          <p className="text-gray-500">Loading products...</p>
        </div>
      </section>
    );
  }
}

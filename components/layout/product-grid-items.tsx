import Grid from 'components/grid';
import { GridTileImage } from 'components/grid/tile';
import { WooCommerceProduct } from 'lib/woocommerce/types';
import Link from 'next/link';

export default function ProductGridItems({ products }: { products: WooCommerceProduct[] }) {
  return (
    <>
      {products.map((product) => (
        <Grid.Item key={product.slug} className="animate-fadeIn">
          <Link
            className="relative inline-block h-full w-full"
            href={`/product/${product.slug}`}
            prefetch={true}
          >
            <GridTileImage
              alt={product.name}
              label={{
                title: product.name,
                amount: product.price || product.regular_price,
                currencyCode: 'USD'
              }}
              src={product.images?.[0]?.src}
              fill
              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          </Link>
        </Grid.Item>
      ))}
    </>
  );
}

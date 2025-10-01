import { optimizedGraphQLClient } from 'lib/graphql/optimized-client';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Grid from 'components/grid';
import ProductGridItems from 'components/layout/product-grid-items';
import { defaultSort, sorting } from 'lib/constants';

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  
  const graphqlResult = await optimizedGraphQLClient.getProductsByCategory(params.collection, { first: 1 });
  const collection = graphqlResult.category;

  if (!collection) return notFound();

  return {
    title: collection.name,
    description: collection.description || `${collection.name} products`
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;
  let products: any[] = [];
  let collection: any = null;
  let executionTime = 0;
  let optimizations: string[] = [];

  const graphqlResult = await optimizedGraphQLClient.getProductsByCategory(params.collection, { first: 20 });
  products = graphqlResult.products;
  collection = graphqlResult.category;
  executionTime = graphqlResult.executionTime;
  optimizations = graphqlResult.optimizations;

  if (!collection) return notFound();

  return (
    <section>
      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}

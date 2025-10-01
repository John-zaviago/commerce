import { defaultSort, sorting } from 'lib/constants';
import { optimizedGraphQLClient } from 'lib/graphql/optimized-client';
import ProductGridClient from './product-grid-client';

export const metadata = {
  title: 'Search',
  description: 'Search for products in the store.'
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, q: searchValue } = searchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  let products: any[] = [];
  let executionTime = 0;
  let optimizations: string[] = [];

  if (searchValue) {
    const graphqlResult = await optimizedGraphQLClient.searchProducts(searchValue, { first: 20 });
    products = graphqlResult.products;
    executionTime = graphqlResult.executionTime;
    optimizations = graphqlResult.optimizations;
  } else {
    const graphqlResult = await optimizedGraphQLClient.getProducts({ first: 20 });
    products = graphqlResult.products;
    executionTime = graphqlResult.executionTime;
    optimizations = graphqlResult.optimizations;
  }

  const resultsText = products.length > 1 ? 'results' : 'result';

  return (
    <>
      {searchValue ? (
        <p className="mb-4">
          {products.length === 0
            ? 'There are no products that match '
            : `Showing ${products.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}
      {products.length > 0 ? (
        <ProductGridClient products={products} />
      ) : null}
    </>
  );
}

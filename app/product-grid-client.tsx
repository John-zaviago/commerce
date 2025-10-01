'use client';

import EnhancedProductGrid from 'components/enhanced/product-grid';
import { GraphQLProduct } from 'lib/graphql/types';

interface ProductGridClientProps {
  products: GraphQLProduct[];
}

export default function ProductGridClient({ products }: ProductGridClientProps) {
  return (
    <EnhancedProductGrid 
      products={products} 
      enablePrefetching={true}
      enableLazyLoading={true}
      enableInfiniteScroll={true}
      showPrefetchIndicator={true}
      pageSize={8}
    />
  );
}


'use client';

import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price';
// import { WooCommerceVariantSelector } from 'components/product/woocommerce-variant-selector';
import Prose from 'components/prose';
import { GraphQLProduct } from 'lib/graphql/types';

export function ProductDescription({ product }: { product: GraphQLProduct }) {
  const price = product.onSale && product.salePrice ? product.salePrice : product.price || product.regularPrice || '0.00';
  const regularPrice = product.regularPrice || '0.00';
  const isOnSale = product.onSale && product.salePrice;

  // Check if this product has variations (simplified for GraphQL)
  const hasVariations = product.type === 'variable';

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.name}</h1>
        {!hasVariations && (
          <>
            <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
              {isOnSale ? (
                <div className="flex items-center gap-2">
                  <Price amount={price} currencyCode="USD" />
                  <span className="text-xs line-through opacity-75">
                    <Price amount={regularPrice} currencyCode="USD" />
                  </span>
                </div>
              ) : (
                <Price amount={price} currencyCode="USD" />
              )}
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                product.stockStatus === 'IN_STOCK' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.stockStatus === 'IN_STOCK' ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </>
        )}
      </div>
      
      {/* Variation Selector for Variable Products - Temporarily disabled for GraphQL-only implementation */}
      {hasVariations ? (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            This is a variable product. Variation selection will be implemented in a future update.
          </p>
        </div>
      ) : null}
      
      {product.description ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.description}
        />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}

'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { GraphQLProduct } from 'lib/graphql/types';

function SubmitButton({
  availableForSale,
  product,
  selectedVariation
}: {
  availableForSale: boolean;
  product: GraphQLProduct;
  selectedVariation: any;
}) {
  const buttonClasses =
    'relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white';
  const disabledClasses = 'cursor-not-allowed opacity-60 hover:opacity-60';

  if (!availableForSale) {
    return (
      <button disabled className={clsx(buttonClasses, disabledClasses)}>
        Out Of Stock
      </button>
    );
  }

  return (
    <button
      aria-label="Add to cart"
      className={clsx(buttonClasses, {
        'hover:opacity-90': true
      })}
      onClick={() => {
        // TODO: Implement WooCommerce cart functionality
        const productToAdd = selectedVariation || product;
        alert(`Adding ${productToAdd.name} to cart${selectedVariation ? ` (${selectedVariation.attributes.map((attr: any) => `${attr.name}: ${attr.option}`).join(', ')})` : ''}`);
      }}
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      Add To Cart
    </button>
  );
}

export function AddToCart({ product }: { product: GraphQLProduct }) {
  // For GraphQL products, we don't have variation selection yet
  const selectedVariation = null;
  
  // Determine availability based on whether it's a variable product with selected variation
  const availableForSale = selectedVariation 
    ? selectedVariation.stockStatus === 'IN_STOCK' && selectedVariation.purchasable
    : product.stockStatus === 'IN_STOCK';

  return (
    <div>
      <SubmitButton 
        availableForSale={availableForSale} 
        product={product}
        selectedVariation={selectedVariation}
      />
      <p className="mt-2 text-sm text-gray-600">
        Cart functionality will be implemented soon.
      </p>
    </div>
  );
}

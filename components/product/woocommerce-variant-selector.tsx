'use client';

import clsx from 'clsx';
import { WooCommerceProduct, WooCommerceVariation } from 'lib/woocommerce/types';
import { useEffect, useMemo, useState } from 'react';
import { useWooCommerceProduct } from './woocommerce-product-context';

interface SelectedVariation {
  variation: WooCommerceVariation | null;
  price: string;
  regularPrice: string;
  salePrice: string | null;
  stockStatus: string;
  image: { src: string; alt: string } | null;
}

export function WooCommerceVariantSelector({ 
  product 
}: { 
  product: WooCommerceProduct 
}) {
  const { selectedOptions, setSelectedOptions, setSelectedVariation } = useWooCommerceProduct();
  const [displayVariation, setDisplayVariation] = useState<SelectedVariation | null>(null);

  // Memoize variation attributes to prevent unnecessary re-renders
  const variationAttributes = useMemo(() => 
    product.attributes?.filter(attr => attr.variation) || [], 
    [product.attributes]
  );

  // If no variation attributes, don't show the selector
  if (variationAttributes.length === 0 || !product.productVariations) {
    return null;
  }

  // Memoize selected options keys to prevent infinite loops
  const selectedOptionsKeys = useMemo(() => Object.keys(selectedOptions), [selectedOptions]);

  // Initialize selected options with first available option for each attribute
  useEffect(() => {
    if (variationAttributes.length > 0 && selectedOptionsKeys.length === 0) {
      const initialOptions: Record<string, string> = {};
      variationAttributes.forEach(attr => {
        if (attr.options && attr.options.length > 0) {
          initialOptions[attr.name] = attr.options[0];
        }
      });
      setSelectedOptions(initialOptions);
    }
  }, [variationAttributes, selectedOptionsKeys.length, setSelectedOptions]);

  // Find matching variation when selected options change
  useEffect(() => {
    if (product.productVariations && selectedOptionsKeys.length > 0) {
      const matchingVariation = product.productVariations.find(variation => {
        return variation.attributes.every(variationAttr => {
          const selectedValue = selectedOptions[variationAttr.name];
          return variationAttr.option === selectedValue;
        });
      });

      if (matchingVariation) {
        const selectedVariationData = {
          variation: matchingVariation,
          price: matchingVariation.on_sale && matchingVariation.sale_price 
            ? matchingVariation.sale_price 
            : matchingVariation.price,
          regularPrice: matchingVariation.regular_price,
          salePrice: matchingVariation.on_sale ? matchingVariation.sale_price : null,
          stockStatus: matchingVariation.stock_status,
          image: matchingVariation.image ? {
            src: matchingVariation.image.src,
            alt: matchingVariation.image.alt
          } : null
        };
        setDisplayVariation(selectedVariationData);
        setSelectedVariation(matchingVariation);
      } else {
        setDisplayVariation(null);
        setSelectedVariation(null);
      }
    }
  }, [selectedOptions, product.productVariations, setSelectedVariation]);

  const handleOptionChange = (attributeName: string, optionValue: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [attributeName]: optionValue
    }));
  };

  const isOptionAvailable = (attributeName: string, optionValue: string) => {
    if (!product.productVariations) return true;

    // Check if any variation has this option value for this attribute
    return product.productVariations.some(variation => {
      const attr = variation.attributes.find(a => a.name === attributeName);
      return attr && attr.option === optionValue;
    });
  };

  const getCurrentPrice = () => {
    if (displayVariation) {
      return displayVariation.price;
    }
    return product.on_sale && product.sale_price ? product.sale_price : product.price;
  };

  const getCurrentRegularPrice = () => {
    if (displayVariation) {
      return displayVariation.regularPrice;
    }
    return product.regular_price;
  };

  const getCurrentSalePrice = () => {
    if (displayVariation) {
      return displayVariation.salePrice;
    }
    return product.on_sale ? product.sale_price : null;
  };

  const getCurrentStockStatus = () => {
    if (displayVariation) {
      return displayVariation.stockStatus;
    }
    return product.stock_status;
  };

  return (
    <div className="mb-6">
      {/* Variation Selectors */}
      {variationAttributes.map(attribute => (
        <div key={attribute.id} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {attribute.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {attribute.options?.map(option => {
              const isSelected = selectedOptions[attribute.name] === option;
              const isAvailable = isOptionAvailable(attribute.name, option);
              
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionChange(attribute.name, option)}
                  disabled={!isAvailable}
                  className={clsx(
                    'px-4 py-2 rounded-md border text-sm font-medium transition-colors',
                    {
                      'border-blue-600 bg-blue-600 text-white': isSelected,
                      'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300': 
                        !isSelected && isAvailable,
                      'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600': 
                        !isAvailable
                    }
                  )}
                  title={!isAvailable ? `${option} - Not Available` : option}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Price Display */}
      <div className="mb-4">
        {displayVariation ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">
              ${getCurrentPrice()}
            </span>
            {getCurrentSalePrice() && (
              <span className="text-lg text-gray-500 line-through">
                ${getCurrentRegularPrice()}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">
              ${getCurrentPrice()}
            </span>
            {getCurrentSalePrice() && (
              <span className="text-lg text-gray-500 line-through">
                ${getCurrentRegularPrice()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stock Status */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          getCurrentStockStatus() === 'instock' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {getCurrentStockStatus() === 'instock' ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>

      {/* Variation Image */}
      {displayVariation?.image && (
        <div className="mb-4">
          <img
            src={displayVariation.image.src}
            alt={displayVariation.image.alt}
            className="w-24 h-24 object-cover rounded-md border"
          />
        </div>
      )}
    </div>
  );
}

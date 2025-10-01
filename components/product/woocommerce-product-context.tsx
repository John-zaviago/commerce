'use client';

import { WooCommerceVariation } from 'lib/woocommerce/types';
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

interface WooCommerceProductContextType {
  selectedVariation: WooCommerceVariation | null;
  setSelectedVariation: (variation: WooCommerceVariation | null) => void;
  selectedOptions: Record<string, string>;
  setSelectedOptions: (options: Record<string, string>) => void;
}

const WooCommerceProductContext = createContext<WooCommerceProductContextType | undefined>(undefined);

export function WooCommerceProductProvider({ children }: { children: ReactNode }) {
  const [selectedVariation, setSelectedVariation] = useState<WooCommerceVariation | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    selectedVariation,
    setSelectedVariation,
    selectedOptions,
    setSelectedOptions,
  }), [selectedVariation, selectedOptions]);

  return (
    <WooCommerceProductContext.Provider value={contextValue}>
      {children}
    </WooCommerceProductContext.Provider>
  );
}

export function useWooCommerceProduct() {
  const context = useContext(WooCommerceProductContext);
  if (context === undefined) {
    throw new Error('useWooCommerceProduct must be used within a WooCommerceProductProvider');
  }
  return context;
}

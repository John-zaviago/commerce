import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';
import { TAGS } from '../constants';
import { woocommerce } from '../woocommerce';
import { WooCommerceCategory, WooCommerceProduct } from './types';

/**
 * Get all products from WooCommerce
 */
export async function getWooCommerceProducts(params: {
  per_page?: number;
  page?: number;
  category?: string;
  search?: string;
  featured?: boolean;
} = {}): Promise<WooCommerceProduct[]> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('minutes', 15);

  try {
    const wcProducts = await woocommerce.getProducts(params);
    console.log('WooCommerce products fetched:', wcProducts.length);
    
    if (!Array.isArray(wcProducts)) {
      console.error('WooCommerce API returned non-array:', wcProducts);
      return [];
    }

    return wcProducts;
  } catch (error) {
    console.error('Error fetching WooCommerce products:', error);
    return [];
  }
}

/**
 * Get a single product by handle (slug)
 */
export async function getWooCommerceProduct(handle: string): Promise<WooCommerceProduct | undefined> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('minutes', 15);

  try {
    const wcProduct = await woocommerce.getProduct(handle);
    if (!wcProduct) return undefined;
    
    // If this is a variable product, fetch its variations
    if (wcProduct.type === 'variable' && wcProduct.variations && wcProduct.variations.length > 0) {
      try {
        const variations = await woocommerce.getProductVariations(wcProduct.id);
        // Add variations to the product object
        (wcProduct as any).productVariations = variations;
      } catch (variationError) {
        console.error('Error fetching product variations:', variationError);
        // Continue without variations
      }
    }
    
    return wcProduct;
  } catch (error) {
    console.error('Error fetching WooCommerce product:', error);
    return undefined;
  }
}

/**
 * Get products by category
 */
export async function getWooCommerceProductsByCategory(categorySlug: string): Promise<WooCommerceProduct[]> {
  // 'use cache';
  // cacheTag(TAGS.products, TAGS.collections);
  // cacheLife('minutes', 30);

  try {
    const wcProducts = await woocommerce.getProducts({ category: categorySlug });
    return wcProducts;
  } catch (error) {
    console.error('Error fetching WooCommerce products by category:', error);
    return [];
  }
}

/**
 * Get all categories (collections)
 */
export async function getWooCommerceCollections(): Promise<WooCommerceCategory[]> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('minutes', 30);

  try {
    const wcCategories = await woocommerce.getCategories();
    return wcCategories;
  } catch (error) {
    console.error('Error fetching WooCommerce collections:', error);
    return [];
  }
}

/**
 * Get a single collection by handle (slug)
 */
export async function getWooCommerceCollection(handle: string): Promise<WooCommerceCategory | undefined> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('minutes', 30);

  try {
    const wcCategory = await woocommerce.getCategoryBySlug(handle);
    if (!wcCategory) return undefined;

    return wcCategory;
  } catch (error) {
    console.error('Error fetching WooCommerce collection:', error);
    return undefined;
  }
}

/**
 * Search products
 */
export async function searchWooCommerceProducts(query: string): Promise<WooCommerceProduct[]> {
  // 'use cache';
  // cacheTag(TAGS.products);
  // cacheLife('minutes', 15);

  try {
    const wcProducts = await woocommerce.getProducts({ search: query });
    return wcProducts;
  } catch (error) {
    console.error('Error searching WooCommerce products:', error);
    return [];
  }
}

/**
 * Get featured products
 */
export async function getWooCommerceFeaturedProducts(): Promise<WooCommerceProduct[]> {
  // 'use cache';
  // cacheTag(TAGS.products);
  // cacheLife('minutes', 30);

  try {
    const wcProducts = await woocommerce.getProducts({ featured: true });
    console.log('Featured products fetched:', wcProducts.length);
    
    if (!Array.isArray(wcProducts)) {
      console.error('WooCommerce API returned non-array for featured products:', wcProducts);
      return [];
    }

    return wcProducts;
  } catch (error) {
    console.error('Error fetching WooCommerce featured products:', error);
    return [];
  }
}

/**
 * Test WooCommerce connection
 */
export async function testWooCommerceConnection(): Promise<{ success: boolean; message: string }> {
  try {
    return await woocommerce.testConnection();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
}

/**
 * Get products for homepage (similar to getCollectionProducts)
 */
export async function getWooCommerceHomepageProducts(): Promise<WooCommerceProduct[]> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('minutes', 15);

  try {
    // Get products directly with featured filter first, then fallback to latest
    const featuredProducts = await woocommerce.getProducts({ featured: true, per_page: 3 });
    
    if (featuredProducts && featuredProducts.length > 0) {
      console.log('Featured products fetched:', featuredProducts.length);
      return featuredProducts;
    }
    
    // If no featured products, get latest products
    console.log('No featured products found, fetching latest products');
    const latestProducts = await woocommerce.getProducts({ per_page: 3 });
    return latestProducts || [];
  } catch (error) {
    console.error('Error fetching WooCommerce homepage products:', error);
    return [];
  }
}

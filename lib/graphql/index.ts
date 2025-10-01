import { graphqlClient } from './client';
import {
    GET_CATEGORIES_QUERY,
    GET_CATEGORY_BY_SLUG_QUERY,
    GET_FEATURED_PRODUCTS_QUERY,
    GET_PRODUCTS_BY_CATEGORY_QUERY,
    GET_PRODUCTS_QUERY,
    GET_PRODUCT_BY_SLUG_QUERY,
    SEARCH_PRODUCTS_QUERY,
} from './queries';

// Types for GraphQL responses
export interface GraphQLProduct {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  stockStatus: string;
  stockQuantity: number | null;
  type: string;
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  images: {
    nodes: Array<{
      id: string;
      sourceUrl: string;
      altText: string;
      mediaDetails: {
        width: number;
        height: number;
      };
    }>;
  };
  categories: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
  attributes: {
    nodes: Array<{
      id: string;
      name: string;
      options: string[];
      variation: boolean;
    }>;
  };
  variations?: {
    nodes: Array<{
      id: string;
      databaseId: number;
      name: string;
      price: string;
      regularPrice: string;
      salePrice: string;
      onSale: boolean;
      stockStatus: string;
      stockQuantity: number | null;
      attributes: {
        nodes: Array<{
          id: string;
          name: string;
          value: string;
        }>;
      };
      image: {
        id: string;
        sourceUrl: string;
        altText: string;
      } | null;
    }>;
  };
  related?: {
    nodes: Array<{
      id: string;
      databaseId: number;
      name: string;
      slug: string;
      price: string;
      regularPrice: string;
      salePrice: string;
      onSale: boolean;
      stockStatus: string;
      images: {
        nodes: Array<{
          id: string;
          sourceUrl: string;
          altText: string;
        }>;
      };
    }>;
  };
  reviews?: {
    nodes: Array<{
      id: string;
      content: string;
      rating: number;
      author: {
        node: {
          name: string;
        };
      };
      date: string;
    }>;
  };
}

export interface GraphQLCategory {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: {
    id: string;
    sourceUrl: string;
    altText: string;
  } | null;
  parent: {
    node: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
}

// Convert GraphQL product to WooCommerce format for compatibility
function convertGraphQLProductToWooCommerce(graphqlProduct: any): any {
  return {
    id: graphqlProduct.databaseId,
    name: graphqlProduct.name,
    slug: graphqlProduct.slug,
    permalink: `/${graphqlProduct.slug}`,
    description: graphqlProduct.description,
    short_description: graphqlProduct.shortDescription,
    price: graphqlProduct.price || '',
    regular_price: graphqlProduct.regularPrice || '',
    sale_price: graphqlProduct.salePrice || '',
    on_sale: graphqlProduct.onSale || false,
    stock_status: graphqlProduct.stockStatus || 'instock',
    type: graphqlProduct.type,
    featured: graphqlProduct.featured,
    average_rating: graphqlProduct.averageRating,
    review_count: graphqlProduct.reviewCount,
    images: graphqlProduct.image ? [{
      id: parseInt(graphqlProduct.image.id),
      src: graphqlProduct.image.sourceUrl,
      alt: graphqlProduct.image.altText,
    }] : [],
    categories: graphqlProduct.productCategories?.nodes?.map((cat: any) => ({
      id: parseInt(cat.id),
      name: cat.name,
      slug: cat.slug,
    })) || [],
    attributes: graphqlProduct.attributes?.nodes?.map((attr: any) => ({
      id: parseInt(attr.id),
      name: attr.name,
      options: attr.options,
      variation: attr.variation,
    })) || [],
    variations: graphqlProduct.variations?.nodes?.map((variation: any) => ({
      id: variation.databaseId,
      price: variation.price,
      regular_price: variation.regularPrice,
      sale_price: variation.salePrice,
      on_sale: variation.onSale,
      stock_status: variation.stockStatus,
      stock_quantity: variation.stockQuantity,
      attributes: variation.attributes?.nodes?.map((attr: any) => ({
        id: parseInt(attr.id),
        name: attr.name,
        option: attr.value,
      })) || [],
      image: variation.image ? {
        id: parseInt(variation.image.id),
        src: variation.image.sourceUrl,
        alt: variation.image.altText,
      } : null,
    })) || [],
    related: graphqlProduct.related?.nodes?.map((related: any) => ({
      id: related.databaseId,
      name: related.name,
      slug: related.slug,
      price: related.price,
      regular_price: related.regularPrice,
      sale_price: related.salePrice,
      on_sale: related.onSale,
      stock_status: related.stockStatus,
      images: related.image ? [{
        id: parseInt(related.image.id),
        src: related.image.sourceUrl,
        alt: related.image.altText,
      }] : [],
    })) || [],
    reviews: graphqlProduct.reviews?.nodes?.map((review: any) => ({
      id: parseInt(review.id),
      content: review.content,
      rating: review.rating,
      author: review.author.node.name,
      date: review.date,
    })) || [],
  };
}

// Convert GraphQL category to WooCommerce format
function convertGraphQLCategoryToWooCommerce(graphqlCategory: GraphQLCategory): any {
  return {
    id: graphqlCategory.databaseId,
    name: graphqlCategory.name,
    slug: graphqlCategory.slug,
    description: graphqlCategory.description,
    count: graphqlCategory.count,
    image: graphqlCategory.image ? {
      id: parseInt(graphqlCategory.image.id),
      src: graphqlCategory.image.sourceUrl,
      alt: graphqlCategory.image.altText,
    } : null,
    parent: graphqlCategory.parent.node ? {
      id: parseInt(graphqlCategory.parent.node.id),
      name: graphqlCategory.parent.node.name,
      slug: graphqlCategory.parent.node.slug,
    } : null,
  };
}

/**
 * Get all products from WooCommerce using GraphQL
 */
export async function getWooCommerceProductsGraphQL(params: {
  per_page?: number;
  page?: number;
  category?: string;
  search?: string;
  featured?: boolean;
} = {}): Promise<any[]> {
  try {
    const variables: any = {
      first: params.per_page || 10,
    };

    // Build where clause
    const where: any = {};
    if (params.category) {
      where.category = params.category;
    }
    if (params.search) {
      where.search = params.search;
    }
    if (params.featured !== undefined) {
      where.featured = params.featured;
    }

    if (Object.keys(where).length > 0) {
      variables.where = where;
    }

    const result = await graphqlClient.request(GET_PRODUCTS_QUERY, variables);
    
    if (!result.products?.nodes) {
      console.error('GraphQL API returned no products:', result);
      return [];
    }

    // Convert to WooCommerce format for compatibility
    return result.products.nodes.map(convertGraphQLProductToWooCommerce);
  } catch (error) {
    console.error('Error fetching WooCommerce products via GraphQL:', error);
    return [];
  }
}

/**
 * Get a single product by handle (slug) using GraphQL
 */
export async function getWooCommerceProductGraphQL(handle: string): Promise<any | undefined> {
  try {
    const result = await graphqlClient.request(GET_PRODUCT_BY_SLUG_QUERY, { slug: handle });
    
    if (!result.product) {
      return undefined;
    }

    return convertGraphQLProductToWooCommerce(result.product);
  } catch (error) {
    console.error('Error fetching WooCommerce product via GraphQL:', error);
    return undefined;
  }
}

/**
 * Get products by category using GraphQL
 */
export async function getWooCommerceProductsByCategoryGraphQL(categorySlug: string): Promise<any[]> {
  try {
    const result = await graphqlClient.request(GET_PRODUCTS_BY_CATEGORY_QUERY, { 
      categorySlug,
      first: 20 
    });
    
    if (!result.products?.nodes) {
      return [];
    }

    return result.products.nodes.map(convertGraphQLProductToWooCommerce);
  } catch (error) {
    console.error('Error fetching WooCommerce products by category via GraphQL:', error);
    return [];
  }
}

/**
 * Get all categories (collections) using GraphQL
 */
export async function getWooCommerceCollectionsGraphQL(): Promise<any[]> {
  try {
    const result = await graphqlClient.request(GET_CATEGORIES_QUERY, { first: 20 });
    
    if (!result.productCategories?.nodes) {
      return [];
    }

    return result.productCategories.nodes.map(convertGraphQLCategoryToWooCommerce);
  } catch (error) {
    console.error('Error fetching WooCommerce collections via GraphQL:', error);
    return [];
  }
}

/**
 * Get a single collection by handle (slug) using GraphQL
 */
export async function getWooCommerceCollectionGraphQL(handle: string): Promise<any | undefined> {
  try {
    const result = await graphqlClient.request(GET_CATEGORY_BY_SLUG_QUERY, { slug: handle });
    
    if (!result.productCategory) {
      return undefined;
    }

    return convertGraphQLCategoryToWooCommerce(result.productCategory);
  } catch (error) {
    console.error('Error fetching WooCommerce collection via GraphQL:', error);
    return undefined;
  }
}

/**
 * Search products using GraphQL
 */
export async function searchWooCommerceProductsGraphQL(query: string): Promise<any[]> {
  try {
    const result = await graphqlClient.request(SEARCH_PRODUCTS_QUERY, { 
      search: query,
      first: 20 
    });
    
    if (!result.products?.nodes) {
      return [];
    }

    return result.products.nodes.map(convertGraphQLProductToWooCommerce);
  } catch (error) {
    console.error('Error searching WooCommerce products via GraphQL:', error);
    return [];
  }
}

/**
 * Get featured products using GraphQL
 */
export async function getWooCommerceFeaturedProductsGraphQL(): Promise<any[]> {
  try {
    const result = await graphqlClient.request(GET_FEATURED_PRODUCTS_QUERY, { first: 3 });
    
    if (!result.products?.nodes) {
      return [];
    }

    return result.products.nodes.map(convertGraphQLProductToWooCommerce);
  } catch (error) {
    console.error('Error fetching WooCommerce featured products via GraphQL:', error);
    return [];
  }
}

/**
 * Get products for homepage using GraphQL
 */
export async function getWooCommerceHomepageProductsGraphQL(): Promise<any[]> {
  try {
    // Get featured products for homepage
    const featuredProducts = await getWooCommerceFeaturedProductsGraphQL();
    
    // If no featured products, get latest products
    if (featuredProducts.length === 0) {
      console.log('No featured products found, fetching latest products');
      const latestProducts = await getWooCommerceProductsGraphQL({ per_page: 3 });
      return latestProducts.slice(0, 3);
    }

    return featuredProducts.slice(0, 3); // Limit to 3 for homepage
  } catch (error) {
    console.error('Error fetching WooCommerce homepage products via GraphQL:', error);
    return [];
  }
}

// GraphQL Product Types
export interface GraphQLImage {
  id: string;
  sourceUrl: string;
  altText: string;
  mediaDetails?: {
    width: number;
    height: number;
  };
}

export interface GraphQLProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  type?: string;
  featured?: boolean;
  averageRating?: number;
  reviewCount?: number;
  image?: GraphQLImage;
  galleryImages?: {
    nodes?: GraphQLImage[];
  };
  productCategories?: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
  // Pricing fields (union type)
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  onSale?: boolean;
  // Stock fields (union type)
  stockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_BACKORDER';
  stockQuantity?: number;
}

export interface GraphQLCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: GraphQLImage;
}

export interface GraphQLProductsResponse {
  products: GraphQLProduct[];
  executionTime: number;
  optimizations: string[];
}

export interface GraphQLProductResponse {
  product: GraphQLProduct;
  executionTime: number;
  optimizations: string[];
}

export interface GraphQLCategoryResponse {
  category: GraphQLCategory;
  products: GraphQLProduct[];
  executionTime: number;
  optimizations: string[];
}

export interface GraphQLSearchResponse {
  products: GraphQLProduct[];
  executionTime: number;
  optimizations: string[];
}

export interface GraphQLHomepageResponse {
  products: GraphQLProduct[];
  categories: GraphQLCategory[];
  executionTime: number;
  optimizations: string[];
}

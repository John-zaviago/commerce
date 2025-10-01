// GraphQL queries for WooCommerce products

export const GET_PRODUCTS_QUERY = `
  query GetProducts($first: Int, $after: String, $where: RootQueryToProductUnionConnectionWhereArgs) {
    products(first: $first, after: $after, where: $where) {
      nodes {
        id
        databaseId
        name
        slug
        description
        shortDescription
        type
        featured
        averageRating
        reviewCount
        image {
          id
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
        ... on Product {
          productCategories {
            nodes {
              id
              name
              slug
            }
          }
        }
        ... on ProductWithPricing {
          price
          regularPrice
          salePrice
        }
        ... on InventoriedProduct {
          stockStatus
          stockQuantity
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_PRODUCT_BY_SLUG_QUERY = `
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      shortDescription
      type
      featured
      averageRating
      reviewCount
      image {
        id
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
      ... on Product {
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
        localAttributes {
          nodes {
            id
            name
            options
            variation
            visible
            position
          }
        }
      }
      ... on ProductWithPricing {
        price
        regularPrice
        salePrice
      }
      ... on InventoriedProduct {
        stockStatus
        stockQuantity
      }
      ... on VariableProduct {
        variations(first: 20) {
          nodes {
            id
            databaseId
            name
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
            image {
              id
              sourceUrl
              altText
            }
            attributes {
              nodes {
                id
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_FEATURED_PRODUCTS_QUERY = `
  query GetFeaturedProducts($first: Int = 3) {
    products(first: $first, where: { featured: true }) {
      nodes {
        id
        databaseId
        name
        slug
        description
        shortDescription
        type
        featured
        averageRating
        reviewCount
        image {
          id
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
        ... on Product {
          productCategories {
            nodes {
              id
              name
              slug
            }
          }
        }
        ... on ProductWithPricing {
          price
          regularPrice
          salePrice
        }
        ... on InventoriedProduct {
          stockStatus
          stockQuantity
        }
      }
    }
  }
`;

export const GET_PRODUCTS_BY_CATEGORY_QUERY = `
  query GetProductsByCategory($categorySlug: String!, $first: Int = 10) {
    products(first: $first, where: { category: $categorySlug }) {
      nodes {
        id
        databaseId
        name
        slug
        description
        shortDescription
        type
        featured
        averageRating
        reviewCount
        image {
          id
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
        ... on Product {
          productCategories {
            nodes {
              id
              name
              slug
            }
          }
        }
        ... on ProductWithPricing {
          price
          regularPrice
          salePrice
        }
        ... on InventoriedProduct {
          stockStatus
          stockQuantity
        }
      }
    }
  }
`;

export const SEARCH_PRODUCTS_QUERY = `
  query SearchProducts($search: String!, $first: Int = 10) {
    products(first: $first, where: { search: $search }) {
      nodes {
        id
        databaseId
        name
        slug
        description
        shortDescription
        type
        featured
        averageRating
        reviewCount
        image {
          id
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
        ... on Product {
          productCategories {
            nodes {
              id
              name
              slug
            }
          }
        }
        ... on ProductWithPricing {
          price
          regularPrice
          salePrice
        }
        ... on InventoriedProduct {
          stockStatus
          stockQuantity
        }
      }
    }
  }
`;

export const GET_CATEGORIES_QUERY = `
  query GetCategories($first: Int = 20) {
    productCategories(first: $first, where: { hideEmpty: true }) {
      nodes {
        id
        databaseId
        name
        slug
        description
        count
        image {
          id
          sourceUrl
          altText
        }
        parent {
          node {
            id
            name
            slug
          }
        }
      }
    }
  }
`;

export const GET_CATEGORY_BY_SLUG_QUERY = `
  query GetCategoryBySlug($slug: ID!) {
    productCategory(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      count
      image {
        id
        sourceUrl
        altText
      }
      parent {
        node {
          id
          name
          slug
        }
      }
    }
  }
`;

// Comprehensive product query with all related data
export const GET_PRODUCT_COMPREHENSIVE_QUERY = `
  query GetProductComprehensive($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      shortDescription
      type
      featured
      averageRating
      reviewCount
      image {
        id
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
      ... on Product {
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
        localAttributes {
          nodes {
            id
            name
            options
            variation
            visible
            position
          }
        }
      }
      ... on ProductWithPricing {
        price
        regularPrice
        salePrice
      }
      ... on InventoriedProduct {
        stockStatus
        stockQuantity
      }
      ... on VariableProduct {
        variations(first: 20) {
          nodes {
            id
            databaseId
            name
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
            image {
              id
              sourceUrl
              altText
            }
            attributes {
              nodes {
                id
                name
                value
              }
            }
          }
        }
      }
    }
    # Get related products
    products(first: 4, where: { category: "uncategorized" }) {
      nodes {
        id
        databaseId
        name
        slug
        price
        regularPrice
        salePrice
        image {
          id
          sourceUrl
          altText
        }
        ... on InventoriedProduct {
          stockStatus
        }
      }
    }
    # Get product reviews
    comments(first: 10, where: { contentTypes: [PRODUCT] }) {
      nodes {
        id
        content
        date
        author {
          node {
            name
            email
          }
        }
        # Note: Rating might need to be fetched from meta fields
      }
    }
  }
`;

// Optimized query for product listings (minimal data)
export const GET_PRODUCTS_LIST_QUERY = `
  query GetProductsList($first: Int, $where: RootQueryToProductUnionConnectionWhereArgs) {
    products(first: $first, where: $where) {
      nodes {
        id
        databaseId
        name
        slug
        image {
          id
          sourceUrl
          altText
        }
        ... on Product {
          productCategories {
            nodes {
              name
              slug
            }
          }
        }
        ... on ProductWithPricing {
          price
          regularPrice
          salePrice
        }
        ... on InventoriedProduct {
          stockStatus
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

// Query for product search with highlighting
export const SEARCH_PRODUCTS_ADVANCED_QUERY = `
  query SearchProductsAdvanced($search: String!, $first: Int = 10, $category: String) {
    products(first: $first, where: { search: $search, category: $category }) {
      nodes {
        id
        databaseId
        name
        slug
        description
        shortDescription
        image {
          id
          sourceUrl
          altText
        }
        ... on Product {
          productCategories {
            nodes {
              id
              name
              slug
            }
          }
        }
        ... on ProductWithPricing {
          price
          regularPrice
          salePrice
        }
        ... on InventoriedProduct {
          stockStatus
        }
      }
    }
    # Get search suggestions
    productCategories(first: 5, where: { search: $search }) {
      nodes {
        id
        name
        slug
        count
      }
    }
  }
`;

// Query for product analytics and sales data
export const GET_PRODUCT_ANALYTICS_QUERY = `
  query GetProductAnalytics($productId: ID!) {
    product(id: $productId, idType: DATABASE_ID) {
      id
      databaseId
      name
      averageRating
      reviewCount
      ... on InventoriedProduct {
        stockStatus
        stockQuantity
      }
      # Note: Sales data might need to be fetched from WooCommerce REST API
      # as it's not typically available in GraphQL
    }
  }
`;

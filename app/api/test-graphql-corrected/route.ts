import { graphqlClient } from 'lib/graphql/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test a corrected product query using inline fragments
    const correctedProductQuery = `
      query TestCorrectedProduct {
        products(first: 1) {
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
            ... on ProductWithPricing {
              price
              regularPrice
              salePrice
              onSale
            }
            ... on InventoriedProduct {
              stockStatus
              stockQuantity
            }
            ... on Product {
              productCategories {
                nodes {
                  id
                  name
                  slug
                }
              }
              productAttributes {
                nodes {
                  id
                  name
                  options
                  variation
                }
              }
            }
          }
        }
      }
    `;

    const result = await graphqlClient.request(correctedProductQuery);
    
    return NextResponse.json({
      success: true,
      product: result.products?.nodes?.[0] || null,
      allProducts: result.products?.nodes || []
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error
      },
      { status: 500 }
    );
  }
}

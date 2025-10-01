import { graphqlClient } from 'lib/graphql/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test a detailed product query to see what fields are available
    const detailedProductQuery = `
      query TestDetailedProduct {
        products(first: 1) {
          nodes {
            id
            databaseId
            name
            slug
            description
            shortDescription
            price
            regularPrice
            salePrice
            onSale
            stockStatus
            stockQuantity
            type
            featured
            averageRating
            reviewCount
            images {
              nodes {
                id
                sourceUrl
                altText
                mediaDetails {
                  width
                  height
                }
              }
            }
            categories {
              nodes {
                id
                name
                slug
              }
            }
            attributes {
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
    `;

    const result = await graphqlClient.request(detailedProductQuery);
    
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

import { graphqlClient } from 'lib/graphql/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Minimal product query
    const minimalQuery = `
      query TestMinimalProduct {
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
            }
          }
        }
      }
    `;

    const result = await graphqlClient.request(minimalQuery);
    
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

import { graphqlClient, testGraphQLConnection } from 'lib/graphql/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic GraphQL connection
    const connectionTest = await testGraphQLConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: connectionTest.message,
        error: 'GraphQL connection failed'
      }, { status: 500 });
    }

    // Test a simple product query
    const productQuery = `
      query GetProducts {
        products(first: 3) {
          nodes {
            id
            name
            slug
            ... on ProductWithPricing {
              price
              regularPrice
              salePrice
            }
            image {
              sourceUrl
              altText
            }
          }
        }
      }
    `;

    const startTime = Date.now();
    const productResult = await graphqlClient.request(productQuery);
    const queryTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'GraphQL is working correctly',
      connection: connectionTest,
      testQuery: {
        query: 'GetProducts',
        executionTime: `${queryTime}ms`,
        resultCount: productResult.products?.nodes?.length || 0,
        sampleData: productResult.products?.nodes?.[0] || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[GraphQL Test] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'GraphQL test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
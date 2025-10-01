import { graphqlClient } from 'lib/graphql/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test different possible query names
    const testQueries = [
      // Try WPGraphQL standard queries
      `query TestPosts { posts { nodes { id title } } }`,
      `query TestPages { pages { nodes { id title } } }`,
      `query TestUsers { users { nodes { id name } } }`,
      
      // Try WooCommerce specific queries
      `query TestWooProducts { products { nodes { id name } } }`,
      `query TestWooCommerceProducts { woocommerceProducts { nodes { id name } } }`,
      `query TestProductCategories { productCategories { nodes { id name } } }`,
      `query TestWooCategories { woocommerceCategories { nodes { id name } } }`,
      
      // Try general settings
      `query TestSettings { generalSettings { title description } }`,
    ];

    const results: any = {};

    for (const query of testQueries) {
      try {
        const result = await graphqlClient.request(query);
        const queryName = query.match(/query\s+(\w+)/)?.[1] || 'unknown';
        results[queryName] = { success: true, data: result };
      } catch (error) {
        const queryName = query.match(/query\s+(\w+)/)?.[1] || 'unknown';
        results[queryName] = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      results
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

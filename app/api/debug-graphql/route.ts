import { graphqlClient } from 'lib/graphql/client';
import { GET_PRODUCTS_QUERY } from 'lib/graphql/queries';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const variables = {
      first: 2,
    };

    console.log('GraphQL Query:', GET_PRODUCTS_QUERY);
    console.log('Variables:', variables);

    const result = await graphqlClient.request(GET_PRODUCTS_QUERY, variables);
    
    console.log('GraphQL Result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      success: true,
      rawResult: result,
      products: result.products?.nodes || [],
      count: result.products?.nodes?.length || 0
    });
  } catch (error) {
    console.error('GraphQL Error:', error);
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

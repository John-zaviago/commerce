import { getWooCommerceProductsGraphQL } from 'lib/graphql/index';
import { getWooCommerceProducts } from 'lib/woocommerce/index';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testParams = { per_page: 3 };
    
    // Test REST API performance
    const restStart = Date.now();
    const restProducts = await getWooCommerceProducts(testParams);
    const restTime = Date.now() - restStart;
    
    // Test GraphQL API performance
    const graphqlStart = Date.now();
    const graphqlProducts = await getWooCommerceProductsGraphQL(testParams);
    const graphqlTime = Date.now() - graphqlStart;
    
    return NextResponse.json({
      success: true,
      comparison: {
        rest: {
          time: restTime,
          count: restProducts.length,
          source: 'REST API'
        },
        graphql: {
          time: graphqlTime,
          count: graphqlProducts.length,
          source: 'GraphQL'
        },
        improvement: {
          timeSaved: restTime - graphqlTime,
          percentageFaster: Math.round(((restTime - graphqlTime) / restTime) * 100)
        }
      },
      products: {
        rest: restProducts,
        graphql: graphqlProducts
      }
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

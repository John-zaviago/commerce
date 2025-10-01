import { getWooCommerceProducts } from 'lib/woocommerce/index';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing WooCommerce variations...');
    
    // Get products to find variable products
    const products = await getWooCommerceProducts({ per_page: 10 });
    
    console.log(`Found ${products.length} products`);
    
    // Filter for variable products
    const variableProducts = products.filter(product => product.type === 'variable');
    
    console.log(`Found ${variableProducts.length} variable products`);
    
    const results = [];
    
    for (const product of variableProducts.slice(0, 3)) { // Test first 3 variable products
      console.log(`Testing product: ${product.name} (ID: ${product.id})`);
      
      const result = {
        productId: product.id,
        productName: product.name,
        productType: product.type,
        hasVariations: !!product.variations && product.variations.length > 0,
        variationIds: product.variations || [],
        hasProductVariations: !!product.productVariations,
        productVariationsCount: product.productVariations?.length || 0,
        attributes: product.attributes?.map(attr => ({
          name: attr.name,
          variation: attr.variation,
          options: attr.options
        })) || []
      };
      
      if (product.productVariations && product.productVariations.length > 0) {
        result.firstVariation = {
          id: product.productVariations[0].id,
          price: product.productVariations[0].price,
          stockStatus: product.productVariations[0].stock_status,
          attributes: product.productVariations[0].attributes.map(attr => ({
            name: attr.name,
            option: attr.option
          }))
        };
      }
      
      results.push(result);
    }
    
    return NextResponse.json({
      success: true,
      totalProducts: products.length,
      variableProducts: variableProducts.length,
      testResults: results
    });
    
  } catch (error) {
    console.error('Error testing variations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

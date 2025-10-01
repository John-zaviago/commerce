import { enhancedGraphQLClient } from 'lib/graphql/enhanced-client';
import { getWooCommerceProducts } from 'lib/woocommerce/index';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testResults: any = {};

    // Test 1: Basic Product Fetching
    console.log('Testing basic product fetching...');
    const basicStart = Date.now();
    const basicProducts = await enhancedGraphQLClient.getProductsOptimized({ per_page: 5 });
    const basicTime = Date.now() - basicStart;

    // Test 2: REST API Comparison
    const restStart = Date.now();
    const restProducts = await getWooCommerceProducts({ per_page: 5 });
    const restTime = Date.now() - restStart;

    // Test 3: Comprehensive Product Query
    console.log('Testing comprehensive product query...');
    const comprehensiveStart = Date.now();
    const comprehensiveData = await enhancedGraphQLClient.getProductComprehensive(
      restProducts[0]?.slug || 'test-product'
    );
    const comprehensiveTime = Date.now() - comprehensiveStart;

    // Test 4: Homepage Data Batch
    console.log('Testing homepage data batch...');
    const homepageStart = Date.now();
    const homepageData = await enhancedGraphQLClient.getHomepageData();
    const homepageTime = Date.now() - homepageStart;

    // Test 5: Advanced Search
    console.log('Testing advanced search...');
    const searchStart = Date.now();
    const searchResults = await enhancedGraphQLClient.searchProductsAdvanced('test');
    const searchTime = Date.now() - searchStart;

    // Test 6: Field Selection Optimization
    console.log('Testing field selection optimization...');
    const optimizedStart = Date.now();
    const optimizedProducts = await enhancedGraphQLClient.getProductsOptimized({
      per_page: 5,
      fields: ['id', 'name', 'slug', 'price'] // Only essential fields
    });
    const optimizedTime = Date.now() - optimizedStart;

    // Calculate improvements
    const basicImprovement = Math.round(((restTime - basicTime) / restTime) * 100);
    const optimizedImprovement = Math.round(((restTime - optimizedTime) / restTime) * 100);

    testResults.basic = {
      name: 'Basic GraphQL vs REST',
      graphql: { time: basicTime, count: basicProducts.length },
      rest: { time: restTime, count: restProducts.length },
      improvement: `${basicImprovement}% faster`
    };

    testResults.comprehensive = {
      name: 'Comprehensive Product Query',
      time: comprehensiveTime,
      data: {
        product: !!comprehensiveData.product,
        related: comprehensiveData.related.length,
        reviews: comprehensiveData.reviews.length
      }
    };

    testResults.homepage = {
      name: 'Homepage Data Batch',
      time: homepageTime,
      data: {
        featured: homepageData.featured.length,
        categories: homepageData.categories.length,
        latest: homepageData.latest.length
      }
    };

    testResults.search = {
      name: 'Advanced Search',
      time: searchTime,
      data: {
        products: searchResults.products.length,
        suggestions: searchResults.suggestions.length
      }
    };

    testResults.optimized = {
      name: 'Field Selection Optimization',
      graphql: { time: optimizedTime, count: optimizedProducts.length },
      rest: { time: restTime, count: restProducts.length },
      improvement: `${optimizedImprovement}% faster`
    };

    // Summary
    const summary = {
      totalTests: 5,
      averageImprovement: Math.round((basicImprovement + optimizedImprovement) / 2),
      fastestQuery: Math.min(basicTime, optimizedTime, comprehensiveTime, homepageTime, searchTime),
      slowestQuery: Math.max(basicTime, optimizedTime, comprehensiveTime, homepageTime, searchTime)
    };

    return NextResponse.json({
      success: true,
      summary,
      tests: testResults,
      recommendations: [
        'Use field selection for product listings to reduce payload size',
        'Use comprehensive queries for product detail pages to reduce API calls',
        'Use batch queries for homepage data to improve loading speed',
        'Implement caching for frequently accessed data',
        'Use circuit breaker pattern for error resilience'
      ]
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

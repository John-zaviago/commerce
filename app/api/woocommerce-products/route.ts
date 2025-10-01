import { getWooCommerceProducts } from 'lib/woocommerce/index';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const per_page = searchParams.get('per_page');
    const page = searchParams.get('page');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    const products = await getWooCommerceProducts({
      per_page: per_page ? parseInt(per_page) : undefined,
      page: page ? parseInt(page) : undefined,
      category: category || undefined,
      search: search || undefined,
      featured: featured === 'true' ? true : undefined,
    });

    return NextResponse.json({
      success: true,
      products,
      count: products.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800', // Cache for 15 minutes
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error',
        products: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

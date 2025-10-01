import { testWooCommerceConnection } from 'lib/woocommerce/index';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await testWooCommerceConnection();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

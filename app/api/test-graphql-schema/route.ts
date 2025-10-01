import { graphqlClient } from 'lib/graphql/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test a simple introspection query to see what's available
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType {
            name
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    `;

    const result = await graphqlClient.request(introspectionQuery);
    
    return NextResponse.json({
      success: true,
      schema: result.__schema.queryType.fields.filter((field: any) => 
        field.name.toLowerCase().includes('product') || 
        field.name.toLowerCase().includes('woo')
      ),
      allFields: result.__schema.queryType.fields.map((field: any) => field.name)
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

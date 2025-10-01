import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = process.env.WOOCOMMERCE_URL 
  ? `${process.env.WOOCOMMERCE_URL}/graphql`
  : 'https://johnp500.sg-host.com/graphql';

// Create GraphQL client
export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test GraphQL connection
export async function testGraphQLConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const query = `
      query TestConnection {
        generalSettings {
          title
          description
        }
      }
    `;
    
    const result = await graphqlClient.request(query);
    
    if (result.generalSettings) {
      return { 
        success: true, 
        message: `Successfully connected to GraphQL API. Site: ${result.generalSettings.title}` 
      };
    } else {
      return { 
        success: false, 
        message: 'GraphQL API responded but no data received' 
      };
    }
  } catch (error) {
    console.error('GraphQL connection error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown GraphQL connection error'
    };
  }
}

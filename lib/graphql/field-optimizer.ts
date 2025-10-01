export interface QueryContext {
  page?: string;
  component?: string;
  device?: 'mobile' | 'desktop';
  connection?: 'slow' | 'fast';
}

export class GraphQLFieldOptimizer {
  static optimizeQuery(query: string, context: QueryContext = {}): string {
    try {
      if (context.device === 'mobile' || context.connection === 'slow') {
        return this.selectMinimalFields(query);
      }
      if (context.page === 'product') {
        return this.selectProductFields(query);
      }
      if (context.component === 'product-grid') {
        return this.selectGridFields(query);
      }
      return this.selectDefaultFields(query);
    } catch (error) {
      console.error('[Field Optimizer] Error:', error);
      return query;
    }
  }

  static getFieldSelection(context: QueryContext = {}): string[] {
    try {
      if (context.device === 'mobile' || context.connection === 'slow') {
        return ['id', 'name', 'slug', 'price', 'image { sourceUrl altText }'];
      }
      if (context.page === 'product') {
        return [
          'id', 'name', 'slug', 'description', 'price', 'regularPrice', 
          'salePrice', 'onSale', 'stockStatus', 'images { sourceUrl altText }',
          'categories { name slug }'
        ];
      }
      if (context.component === 'product-grid') {
        return [
          'id', 'name', 'slug', 'price', 'onSale', 
          'image { sourceUrl altText }', 'categories { name }'
        ];
      }
      return ['id', 'name', 'slug', 'price', 'image { sourceUrl altText }'];
    } catch (error) {
      console.error('[Field Optimizer] Error:', error);
      return ['id', 'name', 'slug', 'price'];
    }
  }

  static getFieldStats(context: QueryContext = {}): { fieldCount: number; estimatedSize: number; optimization: string } {
    const fields = this.getFieldSelection(context);
    const fieldCount = fields.length;
    const estimatedSize = fieldCount * 50; // Rough estimate: 50 bytes per field
    const optimization = context.device === 'mobile' ? 'minimal' : 
                        context.page === 'product' ? 'full' : 
                        context.component === 'product-grid' ? 'grid' : 'default';
    
    return {
      fieldCount,
      estimatedSize,
      optimization
    };
  }

  private static selectMinimalFields(query: string): string {
    const fields = ['id', 'name', 'slug', 'price', 'image { sourceUrl altText }'];
    return this.replaceFields(query, fields);
  }

  private static selectProductFields(query: string): string {
    const fields = [
      'id', 'name', 'slug', 'description', 'price', 'regularPrice', 
      'salePrice', 'onSale', 'stockStatus', 'images { sourceUrl altText }',
      'categories { name slug }'
    ];
    return this.replaceFields(query, fields);
  }

  private static selectGridFields(query: string): string {
    const fields = [
      'id', 'name', 'slug', 'price', 'onSale', 
      'image { sourceUrl altText }', 'categories { name }'
    ];
    return this.replaceFields(query, fields);
  }

  private static selectDefaultFields(query: string): string {
    const fields = ['id', 'name', 'slug', 'price', 'image { sourceUrl altText }'];
    return this.replaceFields(query, fields);
  }

  private static replaceFields(query: string, fields: string[]): string {
    const fieldString = fields.join('\n    ');
    // More precise regex to match GraphQL selection sets
    return query.replace(/(\{[^}]*\})/g, (match) => {
      // Only replace if it looks like a GraphQL selection set
      if (match.includes('{') && match.includes('}')) {
        return `{\n    ${fieldString}\n  }`;
      }
      return match;
    });
  }
}

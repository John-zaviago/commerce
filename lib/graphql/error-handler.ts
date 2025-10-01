// GraphQL Error Handling and Retry Logic

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface GraphQLErrorResponse {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: any;
}

export class GraphQLErrorHandler {
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2
  };

  // Check if error is retryable
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      return true;
    }

    // HTTP 5xx errors
    if (error.response?.status >= 500) {
      return true;
    }

    // Rate limiting
    if (error.response?.status === 429) {
      return true;
    }

    // GraphQL errors that might be temporary
    if (error.response?.errors) {
      const graphqlErrors = error.response.errors as GraphQLErrorResponse[];
      return graphqlErrors.some(err => 
        err.message.includes('timeout') || 
        err.message.includes('rate limit') ||
        err.message.includes('temporary')
      );
    }

    return false;
  }

  // Calculate delay with exponential backoff
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  // Retry logic with exponential backoff
  async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: any;

    for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        console.log(`[GraphQL Retry] Attempt ${attempt}/${finalConfig.maxRetries} failed:`, error.message);

        // Don't retry on last attempt or non-retryable errors
        if (attempt === finalConfig.maxRetries || !this.isRetryableError(error)) {
          break;
        }

        // Wait before retrying
        const delay = this.calculateDelay(attempt, finalConfig);
        console.log(`[GraphQL Retry] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    throw this.enhanceError(lastError);
  }

  // Enhance error with more context
  private enhanceError(error: any): Error {
    let message = 'GraphQL request failed';
    let code = 'GRAPHQL_ERROR';

    if (error.response?.errors) {
      const graphqlErrors = error.response.errors as GraphQLErrorResponse[];
      message = graphqlErrors.map(err => err.message).join('; ');
      code = 'GRAPHQL_VALIDATION_ERROR';
    } else if (error.response?.status) {
      message = `HTTP ${error.response.status}: ${error.message}`;
      code = `HTTP_${error.response.status}`;
    } else if (error.code) {
      message = `${error.code}: ${error.message}`;
      code = error.code;
    }

    const enhancedError = new Error(message);
    (enhancedError as any).code = code;
    (enhancedError as any).originalError = error;
    (enhancedError as any).response = error.response;

    return enhancedError;
  }

  // Handle specific GraphQL errors
  handleGraphQLError(error: any): { message: string; code: string; retryable: boolean } {
    if (error.response?.errors) {
      const graphqlErrors = error.response.errors as GraphQLErrorResponse[];
      
      for (const graphqlError of graphqlErrors) {
        // Handle specific error types
        if (graphqlError.message.includes('Cannot query field')) {
          return {
            message: 'Invalid GraphQL query - field not found',
            code: 'INVALID_FIELD',
            retryable: false
          };
        }
        
        if (graphqlError.message.includes('rate limit')) {
          return {
            message: 'Rate limit exceeded - please try again later',
            code: 'RATE_LIMIT',
            retryable: true
          };
        }
        
        if (graphqlError.message.includes('timeout')) {
          return {
            message: 'Request timeout - server is busy',
            code: 'TIMEOUT',
            retryable: true
          };
        }
      }
    }

    return {
      message: error.message || 'Unknown GraphQL error',
      code: 'UNKNOWN_ERROR',
      retryable: this.isRetryableError(error)
    };
  }

  // Circuit breaker pattern for failing services
  private circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
    threshold: 5,
    timeout: 60000 // 1 minute
  };

  async withCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if circuit is open
    if (this.circuitBreaker.state === 'OPEN') {
      if (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        console.log('[GraphQL Circuit Breaker] Moving to HALF_OPEN state');
      } else {
        throw new Error('GraphQL service is temporarily unavailable (circuit breaker open)');
      }
    }

    try {
      const result = await operation();
      
      // Success - reset circuit breaker
      if (this.circuitBreaker.state === 'HALF_OPEN') {
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failures = 0;
        console.log('[GraphQL Circuit Breaker] Moving to CLOSED state');
      }
      
      return result;
    } catch (error) {
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailureTime = now;

      // Open circuit if threshold exceeded
      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.state = 'OPEN';
        console.log('[GraphQL Circuit Breaker] Moving to OPEN state');
      }

      throw error;
    }
  }
}

// Create singleton instance
export const graphqlErrorHandler = new GraphQLErrorHandler();

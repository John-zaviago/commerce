// Server-side only Redis client
let Redis: any = null;
let redisClient: any = null;

// Only import Redis on server-side
if (typeof window === 'undefined') {
  try {
    Redis = require('ioredis');
    
    // Redis configuration
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    // Create Redis client
    redisClient = new Redis(redisConfig);
  } catch (error) {
    console.warn('Redis not available:', error);
  }
}

export { redisClient };

// Handle Redis connection events (only if client exists)
if (redisClient) {
  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('error', (error) => {
    console.error('❌ Redis connection error:', error.message);
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis is ready to accept commands');
  });

  redisClient.on('close', () => {
    console.log('⚠️ Redis connection closed');
  });
}

// Health check function
export async function redisHealthCheck(): Promise<{ status: string; message: string; connected: boolean }> {
  if (!redisClient) {
    return {
      status: 'unhealthy',
      message: 'Redis client not available (server-side only)',
      connected: false
    };
  }

  try {
    // Try to ping Redis
    const pong = await redisClient.ping();
    
    if (pong === 'PONG') {
      return {
        status: 'healthy',
        message: 'Redis is connected and responding',
        connected: true
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Redis ping failed',
        connected: false
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Redis health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      connected: false
    };
  }
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  if (!redisClient) return;
  
  try {
    await redisClient.quit();
    console.log('✅ Redis connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
  }
}

// Initialize connection
export async function initializeRedis(): Promise<boolean> {
  if (!redisClient) return false;
  
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    return false;
  }
}

export const REDIS_CONFIG = {
  // Redis connection settings
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  
  // Cache settings
  enabled: process.env.REDIS_ENABLED === 'true' || process.env.NODE_ENV === 'production',
  
  // TTL settings (in seconds)
  ttl: {
    default: parseInt(process.env.CACHE_TTL_DEFAULT || '600'), // 10 minutes
    product: parseInt(process.env.CACHE_TTL_PRODUCT || '1800'), // 30 minutes
    category: parseInt(process.env.CACHE_TTL_CATEGORY || '3600'), // 1 hour
    search: parseInt(process.env.CACHE_TTL_SEARCH || '300'), // 5 minutes
    homepage: parseInt(process.env.CACHE_TTL_HOMEPAGE || '900'), // 15 minutes
    user: parseInt(process.env.CACHE_TTL_USER || '300'), // 5 minutes
  },
  
  // Performance settings
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  
  // Cache key prefixes
  prefixes: {
    graphql: 'graphql',
    product: 'graphql:product',
    category: 'graphql:category',
    search: 'graphql:search',
    homepage: 'graphql:homepage',
    user: 'graphql:user',
  },
  
  // Cache versioning
  version: 'v1',
};

export const isRedisEnabled = (): boolean => {
  return REDIS_CONFIG.enabled;
};

export const getRedisConfig = () => {
  return REDIS_CONFIG;
};

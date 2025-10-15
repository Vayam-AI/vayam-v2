import Redis from 'ioredis';

class RedisClient {
  private static instance: Redis | null = null;

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL;
      const redisPassword = process.env.REDIS_PASSWORD;
      
      // If REDIS_URL is provided, use it directly (should include password)
      if (redisUrl) {
        RedisClient.instance = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableReadyCheck: true,
          commandTimeout: 5000,
          connectTimeout: 10000,
          family: 4,
        });
      } else if (redisPassword) {
        // Fallback to individual connection parameters with password
        RedisClient.instance = new Redis({
          host: 'redis-11215.c262.us-east-1-3.ec2.redns.redis-cloud.com',
          port: 11215,
          password: redisPassword,
          username: 'default',
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableReadyCheck: true,
          commandTimeout: 5000,
          connectTimeout: 10000,
          family: 4,
        });
      } else {
        throw new Error('Either REDIS_URL or REDIS_PASSWORD must be provided');
      }

      RedisClient.instance.on('error', (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Redis connection error:', error);
        }
      });

      RedisClient.instance.on('connect', () => {
        // Redis connected successfully
      });

      RedisClient.instance.on('ready', () => {
        // Redis is ready to accept commands
      });

      RedisClient.instance.on('reconnecting', () => {
        // Redis reconnecting...
      });
    }

    return RedisClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
    }
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const redis = RedisClient.getInstance();
      await redis.ping();
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Redis connection test failed:', error);
      }
      return false;
    }
  }
}

export default RedisClient;
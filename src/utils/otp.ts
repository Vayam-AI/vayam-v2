import RedisClient from '@/lib/redis';

const OTP_EXPIRY = 180; // 3 minutes in seconds (used for OTP validity and resend)

export class OTPService {
  private redis = RedisClient.getInstance();

  /**
   * Generate a 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get Redis key for OTP
   */
  private getOTPKey(email: string): string {
    return `otp:${email}`;
  }

  /**
   * Store OTP in Redis with expiry
   */
  async storeOTP(email: string, otp: string): Promise<void> {
    try {
      const key = this.getOTPKey(email);
      await this.redis.setex(key, OTP_EXPIRY, otp);
    } catch (error) {
      // OTP storage error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to store OTP:', error);
      }
      throw new Error('Failed to store OTP. Please try again.');
    }
  }

  /**
   * Verify OTP and remove from Redis if valid
   */
  async verifyOTP(email: string, otp: string): Promise<boolean> {
    try {
      const key = this.getOTPKey(email);
      const storedOTP = await this.redis.get(key);
      
      if (!storedOTP || storedOTP !== otp) {
        return false;
      }

      // Delete OTP after successful verification
      await this.redis.del(key);
      return true;
    } catch (error) {
      // OTP verification error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to verify OTP:', error);
      }
      return false;
    }
  }

  /**
   * Check if OTP exists for email (for rate limiting)
   */
  async hasActiveOTP(email: string): Promise<boolean> {
    try {
      const key = this.getOTPKey(email);
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      // OTP existence check error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to check OTP existence:', error);
      }
      return false;
    }
  }

  /**
   * Get remaining TTL for OTP
   */
  async getOTPTTL(email: string): Promise<number> {
    try {
      const key = this.getOTPKey(email);
      return await this.redis.ttl(key);
    } catch (error) {
      // OTP TTL error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to get OTP TTL:', error);
      }
      return -1;
    }
  }
}

export const otpService = new OTPService();
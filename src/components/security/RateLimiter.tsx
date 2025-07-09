import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitState {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const defaultConfig: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 5 * 60 * 1000, // 5 minutes
};

class RateLimiter {
  private limits: Map<string, RateLimitState> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = defaultConfig) {
    this.config = config;
  }

  checkLimit(key: string): boolean {
    const now = Date.now();
    const state = this.limits.get(key);

    if (!state) {
      this.limits.set(key, {
        attempts: 1,
        firstAttempt: now,
      });
      return true;
    }

    // Check if still blocked
    if (state.blockedUntil && now < state.blockedUntil) {
      const remainingTime = Math.ceil((state.blockedUntil - now) / 1000);
      toast.error(`Bạn đã bị tạm khóa. Vui lòng thử lại sau ${remainingTime} giây`);
      return false;
    }

    // Reset if window expired
    if (now - state.firstAttempt > this.config.windowMs) {
      this.limits.set(key, {
        attempts: 1,
        firstAttempt: now,
      });
      return true;
    }

    // Increment attempts
    state.attempts++;

    // Block if exceeded
    if (state.attempts > this.config.maxAttempts) {
      state.blockedUntil = now + this.config.blockDurationMs;
      const blockDurationMinutes = Math.ceil(this.config.blockDurationMs / 60000);
      toast.error(`Quá nhiều lần thử. Bạn đã bị tạm khóa trong ${blockDurationMinutes} phút`);
      return false;
    }

    // Warning when approaching limit
    if (state.attempts === this.config.maxAttempts - 1) {
      toast.warning('Bạn chỉ còn 1 lần thử');
    }

    return true;
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  getRemainingAttempts(key: string): number {
    const state = this.limits.get(key);
    if (!state) return this.config.maxAttempts;
    return Math.max(0, this.config.maxAttempts - state.attempts);
  }
}

// Global rate limiter instances
const paymentLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 10 * 60 * 1000, // 10 minutes
});

const loginLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
});

const apiLimiter = new RateLimiter({
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 60 * 1000, // 1 minute
});

export const useRateLimit = (type: 'payment' | 'login' | 'api' = 'api') => {
  const getLimiter = () => {
    switch (type) {
      case 'payment': return paymentLimiter;
      case 'login': return loginLimiter;
      default: return apiLimiter;
    }
  };

  const checkLimit = useCallback((key: string = 'default') => {
    return getLimiter().checkLimit(key);
  }, [type]);

  const reset = useCallback((key: string = 'default') => {
    getLimiter().reset(key);
  }, [type]);

  const getRemainingAttempts = useCallback((key: string = 'default') => {
    return getLimiter().getRemainingAttempts(key);
  }, [type]);

  return { checkLimit, reset, getRemainingAttempts };
};

export { RateLimiter };
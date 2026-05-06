import type { RateLimitConfig, TierConfig } from '@/types/config'
import type { RateLimiterState } from '@/types/simulation'

interface ClientLimiter {
  average: RateLimiterState
  peak: RateLimiterState
  averageConfig: RateLimitConfig
  peakConfig: RateLimitConfig
}

export class ApiGateway {
  private limiters = new Map<string, ClientLimiter>()
  totalRejected = 0
  rejectedThisTick = 0

  constructor(private tiers: Map<string, TierConfig>) {}

  registerClient(clientId: string, tierId: string) {
    const tier = this.tiers.get(tierId)!
    this.limiters.set(clientId, {
      average: { windowStart: 0, requestCount: 0 },
      peak: { windowStart: 0, requestCount: 0 },
      averageConfig: tier.averageRateLimit,
      peakConfig: tier.peakRateLimit,
    })
  }

  beginTick() {
    this.rejectedThisTick = 0
  }

  checkRequest(clientId: string, currentTimeMs: number): { allowed: boolean; reason?: 'rate_limit_average' | 'rate_limit_peak' } {
    const limiter = this.limiters.get(clientId)!

    if (!this.checkWindow(limiter.average, limiter.averageConfig, currentTimeMs)) {
      this.totalRejected++
      this.rejectedThisTick++
      return { allowed: false, reason: 'rate_limit_average' }
    }
    if (!this.checkWindow(limiter.peak, limiter.peakConfig, currentTimeMs)) {
      this.totalRejected++
      this.rejectedThisTick++
      return { allowed: false, reason: 'rate_limit_peak' }
    }

    return { allowed: true }
  }

  private checkWindow(state: RateLimiterState, config: RateLimitConfig, currentTimeMs: number): boolean {
    const windowStart = Math.floor(currentTimeMs / config.windowMs) * config.windowMs
    if (windowStart !== state.windowStart) {
      state.windowStart = windowStart
      state.requestCount = 0
    }
    if (state.requestCount >= config.maxRequests) return false
    state.requestCount++
    return true
  }
}

import type { TierConfig, ClientConfig } from '@/types/config'
import type { PaymentMessage, RateLimiterState, NodeMetrics } from '@/types/simulation'
import type { PipelineComponent } from '../pipeline-component'
import { WorkloadGenerator } from '../client-workload'
import { MetricsTracker } from '../metrics-tracker'

interface ClientLimiter {
  average: RateLimiterState
  peak: RateLimiterState
  averageConfig: { windowMs: number; maxRequests: number }
  peakConfig: { windowMs: number; maxRequests: number }
}

export class ApiGateway implements PipelineComponent {
  private limiters = new Map<string, ClientLimiter>()
  private workload: WorkloadGenerator
  private msgIdCounter = 0
  totalRejected = 0
  rejectedThisTick = 0

  constructor(
    readonly nodeId: string,
    tiers: Map<string, TierConfig>,
    clients: ClientConfig[],
    private tracker: MetricsTracker,
  ) {
    this.workload = new WorkloadGenerator(clients)
    for (const client of clients) {
      const tier = tiers.get(client.tierId)!
      this.limiters.set(client.id, {
        average: { windowStart: 0, requestCount: 0 },
        peak: { windowStart: 0, requestCount: 0 },
        averageConfig: tier.averageRateLimit,
        peakConfig: tier.peakRateLimit,
      })
    }
  }

  // Gateway has no predecessors — receive is a no-op
  receive(_msg: PaymentMessage, _t: number): boolean {
    return true
  }

  tick(t: number, step: number): PaymentMessage[] {
    this.rejectedThisTick = 0
    const requests = this.workload.generateRequests(t, step)
    const accepted: PaymentMessage[] = []

    for (const [clientId, count] of requests) {
      for (let i = 0; i < count; i++) {
        this.tracker.recordSent(clientId)
        const msg: PaymentMessage = {
          id: this.msgIdCounter++,
          clientId,
          createdAtMs: t,
          rejected: false,
          nodeEntryMs: { [this.nodeId]: t },
          nodeExitMs: {},
        }
        const result = this.checkRequest(clientId, t)
        if (!result.allowed) {
          msg.rejected = true
          msg.rejectedReason = result.reason
          this.tracker.recordRejected(clientId)
        } else {
          msg.nodeExitMs[this.nodeId] = t
          accepted.push(msg)
        }
      }
    }

    return accepted
  }

  get metrics(): NodeMetrics {
    return { totalRejected: this.totalRejected, rejectedThisTick: this.rejectedThisTick }
  }

  private checkRequest(clientId: string, t: number): { allowed: boolean; reason?: 'rate_limit_average' | 'rate_limit_peak' } {
    const limiter = this.limiters.get(clientId)!
    if (!this.checkWindow(limiter.average, limiter.averageConfig, t)) {
      this.totalRejected++
      this.rejectedThisTick++
      return { allowed: false, reason: 'rate_limit_average' }
    }
    if (!this.checkWindow(limiter.peak, limiter.peakConfig, t)) {
      this.totalRejected++
      this.rejectedThisTick++
      return { allowed: false, reason: 'rate_limit_peak' }
    }
    return { allowed: true }
  }

  private checkWindow(state: RateLimiterState, config: { windowMs: number; maxRequests: number }, t: number): boolean {
    const windowStart = Math.floor(t / config.windowMs) * config.windowMs
    if (windowStart !== state.windowStart) {
      state.windowStart = windowStart
      state.requestCount = 0
    }
    if (state.requestCount >= config.maxRequests) return false
    state.requestCount++
    return true
  }
}

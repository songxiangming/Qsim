export interface PaymentMessage {
  id: number
  clientId: string
  createdAtMs: number
  rejected: boolean
  rejectedReason?: 'rate_limit_average' | 'rate_limit_peak' | 'queue_full' | 'rate_limited'
  nodeEntryMs: Record<string, number>
  nodeExitMs: Record<string, number>
  completedAtMs?: number
}

export interface RateLimiterState {
  windowStart: number
  requestCount: number
}

export interface NodeMetrics {
  inFlight?: number
  depth?: number
  totalRejected?: number
  rejectedThisTick?: number
}

export interface TickMetrics {
  currentTimeMs: number
  nodeMetrics: Record<string, NodeMetrics>
}

export interface ClientResults {
  clientId: string
  clientName: string
  tierName: string
  totalSent: number
  totalSuccessful: number
  totalRejected: number
  p95LatencyMs: number
  p95E2eLatencyMs: number
}

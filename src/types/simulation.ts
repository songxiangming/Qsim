export interface PaymentMessage {
  id: number
  clientId: string
  createdAtMs: number
  gatewayEntryMs: number
  preprocessorEntryMs?: number
  preprocessorDoneMs?: number
  q1EntryMs?: number
  asyncProcessorEntryMs?: number
  asyncProcessorDoneMs?: number
  q2EntryMs?: number
  bosEntryMs?: number
  completedAtMs?: number
  rejected: boolean
  rejectedReason?: 'rate_limit_average' | 'rate_limit_peak' | 'q1_full' | 'q2_full'
}

export interface RateLimiterState {
  windowStart: number
  requestCount: number
}

export interface TickMetrics {
  currentTimeMs: number
  gatewayTotalRejected: number
  gatewayRejectedThisTick: number
  q1Depth: number
  q2Depth: number
  preprocessorInFlight: number
  asyncProcessorInFlight: number
  bosInFlight: number
}

export interface ClientResults {
  clientId: string
  clientName: string
  tierName: string
  totalSent: number
  totalSuccessful: number
  totalRejected: number
  p50LatencyMs: number
  p95LatencyMs: number
}

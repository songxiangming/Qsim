export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export interface TierConfig {
  id: string
  name: string
  averageRateLimit: RateLimitConfig
  peakRateLimit: RateLimitConfig
}

export type WorkloadPattern =
  | { type: 'stable'; requestsPerSecond: number }
  | {
      type: 'burst'
      baseRequestsPerSecond: number
      burstRequestsPerSecond: number
      burstDurationMs: number
      burstIntervalMs: number
    }

export interface ClientConfig {
  id: string
  name: string
  tierId: string
  workload: WorkloadPattern
}

export interface PreprocessorConfig {
  processingLatencyMs: number
}

export interface QueueConfig {
  maxDepth: number
}

export interface AsyncProcessorConfig {
  processingLatencyMs: number
}

export interface BosConfig {
  throughputPerSecond: number
  processingLatencyMs: number
}

export interface SimulationConfig {
  tiers: TierConfig[]
  clients: ClientConfig[]
  preprocessor: PreprocessorConfig
  q1: QueueConfig
  asyncProcessor: AsyncProcessorConfig
  q2: QueueConfig
  bos: BosConfig
  timeStepMs: number
  totalDurationMs: number
}

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

export type NodeType = 'gateway' | 'processor' | 'queue'

export type NodeConfig =
  | { type: 'gateway' }
  | { type: 'processor'; name: string; processingLatencyMs: number; throughputPerSecond?: number }
  | { type: 'queue'; maxDepth: number }

export interface PipelineNode {
  id: string
  config: NodeConfig
  successors: string[]
}

export interface DAGPipelineConfig {
  nodes: PipelineNode[]
  tiers: TierConfig[]
  clients: ClientConfig[]
  timeStepMs: number
  totalDurationMs: number
  batchSleepMs: number
}

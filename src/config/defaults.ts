import type { SimulationConfig } from '@/types/config'

export function createDefaultConfig(): SimulationConfig {
  return {
    tiers: [
      {
        id: 'bronze',
        name: 'Bronze',
        averageRateLimit: { windowMs: 1000, maxRequests: 10 },
        peakRateLimit: { windowMs: 500, maxRequests: 20 },
      },
      {
        id: 'silver',
        name: 'Silver',
        averageRateLimit: { windowMs: 1000, maxRequests: 50 },
        peakRateLimit: { windowMs: 500, maxRequests: 80 },
      },
      {
        id: 'golden',
        name: 'Golden',
        averageRateLimit: { windowMs: 3600*1000, maxRequests: 5*3600 },
        peakRateLimit: { windowMs: 1000, maxRequests: 10 },
      },
    ],
    clients: [
      {
        id: 'client-a',
        name: 'Client A',
        tierId: 'bronze',
        workload: { type: 'stable', requestsPerSecond: 1 },
      },
      {
        id: 'client-b',
        name: 'Client B',
        tierId: 'silver',
        workload: { type: 'stable', requestsPerSecond: 2 },
      },
      {
        id: 'client-c',
        name: 'Client C',
        tierId: 'golden',
        workload: {
          type: 'burst',
          baseRequestsPerSecond: 1,
          burstRequestsPerSecond: 10,
          burstDurationMs: 300000,
          burstIntervalMs: 8*3600*1000,
        },
      },
    ],
    preprocessor: { processingLatencyMs: 50 },
    q1: { maxDepth: 100000 },
    asyncProcessor: { processingLatencyMs: 200 },
    q2: { maxDepth: 50000 },
    bos: { throughputPerSecond: 10, processingLatencyMs: 100 },
    timeStepMs: 100,
    totalDurationMs: 60000,
  }
}

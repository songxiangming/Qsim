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
        averageRateLimit: { windowMs: 3600*1000, maxRequests: 50*3600 },
        peakRateLimit: { windowMs: 1000, maxRequests: 100 },
      },
    ],
    clients: [
      // {
      //   id: 'client-a',
      //   name: 'Client A',
      //   tierId: 'bronze',
      //   workload: { type: 'stable', requestsPerSecond: 1 },
      // },
      // {
      //   id: 'client-b',
      //   name: 'Client B',
      //   tierId: 'silver',
      //   workload: { type: 'stable', requestsPerSecond: 2 },
      // },
      {
        id: 'client-c',
        name: 'Client C',
        tierId: 'golden',
        workload: {
          type: 'burst',
          baseRequestsPerSecond: 1,
          burstRequestsPerSecond: 15,
          burstDurationMs: 100*1000,
          burstIntervalMs: 200*1000,  // measured as start-start
        },
      },
    ],
    preprocessor: { processingLatencyMs: 50 },
    q1: { maxDepth: 100000 },
    asyncProcessor: { processingLatencyMs: 200 },
    q2: { maxDepth: 3000 },
    bos: { throughputPerSecond: 5, processingLatencyMs: 100 },
    timeStepMs: 100,
    totalDurationMs: 1000*1000,
    batchSleepMs: 100,
  }
}

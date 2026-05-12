import type { DAGPipelineConfig } from '@/types/config'

export function createDefaultConfig(): DAGPipelineConfig {
  return {
    nodes: [
      { id: 'gw-1',   config: { type: 'gateway' },                                                                  successors: ['proc-1'], x: 20,   y: 80 },
      { id: 'proc-1', config: { type: 'processor', name: 'Preprocessor', processingLatencyMs: 50 },                 successors: ['q-1'],    x: 240,  y: 80 },
      { id: 'q-1',    config: { type: 'queue', maxDepth: 100000 },                                                  successors: ['proc-2'], x: 460,  y: 80 },
      { id: 'proc-2', config: { type: 'processor', name: 'Async Processor', processingLatencyMs: 200 },             successors: ['proc-3'], x: 680,  y: 80 },
      { id: 'proc-3', config: { type: 'processor', name: 'BOS', processingLatencyMs: 100, throughputPerSecond: 5 }, successors: [],         x: 900,  y: 80 },
    ],
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
        averageRateLimit: { windowMs: 3600 * 1000, maxRequests: 50 * 3600 },
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
          burstRequestsPerSecond: 15,
          burstDurationMs: 100 * 1000,
          burstIntervalMs: 200 * 1000,
        },
      },
    ],
    timeStepMs: 100,
    totalDurationMs: 1000 * 1000,
    batchSleepMs: 100,
  }
}

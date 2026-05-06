import type { SimulationConfig, TierConfig } from '@/types/config'
import type { PaymentMessage, TickMetrics, ClientResults } from '@/types/simulation'
import { ApiGateway } from './components/api-gateway'
import { Preprocessor } from './components/preprocessor'
import { BoundedQueue } from './components/queue'
import { AsyncProcessor } from './components/async-processor'
import { Bos } from './components/bos'
import { WorkloadGenerator } from './client-workload'
import { MetricsTracker } from './metrics-tracker'

export function runSimulation(
  config: SimulationConfig,
  onTick: (metrics: TickMetrics) => void,
  onComplete: (results: ClientResults[]) => void,
  shouldStop: () => boolean,
  isPaused: () => boolean,
) {
  const tierMap = new Map<string, TierConfig>()
  for (const tier of config.tiers) tierMap.set(tier.id, tier)

  const gateway = new ApiGateway(tierMap)
  const preprocessor = new Preprocessor(config.preprocessor)
  const q1 = new BoundedQueue(config.q1)
  const asyncProcessor = new AsyncProcessor(config.asyncProcessor)
  const q2 = new BoundedQueue(config.q2)
  const bos = new Bos(config.bos)
  const workload = new WorkloadGenerator(config.clients)
  const metrics = new MetricsTracker()

  for (const client of config.clients) {
    gateway.registerClient(client.id, client.tierId)
    const tier = tierMap.get(client.tierId)!
    metrics.registerClient(client.id, client.name, tier.name)
  }

  let msgIdCounter = 0
  let lastPostTime = 0
  const POST_INTERVAL = 16

  let t = 0
  const step = config.timeStepMs
  const end = config.totalDurationMs

  function processBatch() {
    if (shouldStop()) {
      onComplete(metrics.getResults())
      return
    }
    if (isPaused()) {
      setTimeout(processBatch, 50)
      return
    }

    const batchEnd = Math.min(t + step * 50, end)

    while (t <= batchEnd) {
      if (shouldStop()) {
        onComplete(metrics.getResults())
        return
      }

      // 1. BOS: complete finished, pull from Q2
      const bosCompleted = bos.tick(t, step, () => q2.dequeue())
      for (const msg of bosCompleted) {
        metrics.recordLatency(msg.clientId, msg.preprocessorDoneMs! - msg.createdAtMs)
      }

      // 2. Async processor completed -> Q2
      const asyncDone = asyncProcessor.collectCompleted(t)
      for (const msg of asyncDone) {
        msg.q2EntryMs = t
        if (!q2.enqueue(msg)) {
          msg.rejected = true
          msg.rejectedReason = 'q2_full'
        }
      }

      // 3. Async processor pulls from Q1
      let q1Msg = q1.dequeue()
      while (q1Msg) {
        asyncProcessor.accept(q1Msg, t)
        q1Msg = q1.dequeue()
      }

      // 4. Preprocessor completed -> Q1
      const preDone = preprocessor.collectCompleted(t)
      for (const msg of preDone) {
        msg.q1EntryMs = t
        if (!q1.enqueue(msg)) {
          msg.rejected = true
          msg.rejectedReason = 'q1_full'
        }
      }

      // 5. Generate client requests + gateway rate limiting
      gateway.beginTick()
      const requests = workload.generateRequests(t, step)
      for (const [clientId, count] of requests) {
        for (let i = 0; i < count; i++) {
          metrics.recordSent(clientId)
          const msg: PaymentMessage = {
            id: msgIdCounter++,
            clientId,
            createdAtMs: t,
            gatewayEntryMs: t,
            rejected: false,
          }
          const result = gateway.checkRequest(clientId, t)
          if (!result.allowed) {
            msg.rejected = true
            msg.rejectedReason = result.reason
            metrics.recordRejected(clientId)
          } else {
            preprocessor.accept(msg, t)
          }
        }
      }

      // 6. Emit tick metrics (throttled)
      const now = performance.now()
      if (now - lastPostTime >= POST_INTERVAL || t >= end) {
        onTick({
          currentTimeMs: t,
          gatewayTotalRejected: gateway.totalRejected,
          gatewayRejectedThisTick: gateway.rejectedThisTick,
          q1Depth: q1.depth,
          q2Depth: q2.depth,
          preprocessorInFlight: preprocessor.inFlightCount,
          asyncProcessorInFlight: asyncProcessor.inFlightCount,
          bosInFlight: bos.inFlightCount,
        })
        lastPostTime = now
      }

      t += step
      
    }

    if (t > end) {
      onComplete(metrics.getResults())
    } else {
      setTimeout(processBatch, config.batchSleepMs)
    }
  }

  processBatch()
}

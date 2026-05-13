import type { DAGPipelineConfig, PipelineNode } from '@/types/config'
import type { PaymentMessage, TickMetrics, ClientResults } from '@/types/simulation'
import type { PipelineComponent } from './pipeline-component'
import { ApiGateway } from './components/api-gateway'
import { Processor } from './components/processor'
import { BoundedQueue } from './components/queue'
import { MetricsTracker } from './metrics-tracker'
import { toposort } from './dag'

function createComponent(
  node: PipelineNode,
  config: DAGPipelineConfig,
  tracker: MetricsTracker,
): PipelineComponent {
  switch (node.config.type) {
    case 'gateway': {
      const tierMap = new Map(config.tiers.map((t) => [t.id, t]))
      return new ApiGateway(node.id, tierMap, config.clients, tracker)
    }
    case 'processor':
      return new Processor(node.id, node.config)
    case 'queue':
      return new BoundedQueue(node.id, node.config)
  }
}

function hgpLatency(msg: PaymentMessage, topsortOrder: string[], nodeMap: Map<string, PipelineNode>): number {
  let syncProcessorId: string | null = null
  for (const id of topsortOrder) {
    const node = nodeMap.get(id)!
    if (node.config.type === 'queue') break
    if (node.config.type === 'processor') syncProcessorId = id
  }
  if (syncProcessorId && msg.nodeExitMs[syncProcessorId] !== undefined) {
    return msg.nodeExitMs[syncProcessorId] - msg.createdAtMs
  }
  return 0
}

export function runSimulation(
  config: DAGPipelineConfig,
  onTick: (metrics: TickMetrics) => void,
  onComplete: (results: ClientResults[]) => void,
  shouldStop: () => boolean,
  isPaused: () => boolean,
) {
  const tracker = new MetricsTracker()
  const tierMap = new Map(config.tiers.map((t) => [t.id, t]))
  for (const client of config.clients) {
    tracker.registerClient(client.id, client.name, tierMap.get(client.tierId)!.name)
  }

  const nodeMap = new Map<string, PipelineNode>(config.nodes.map((n) => [n.id, n]))
  const components = new Map<string, PipelineComponent>()
  for (const node of config.nodes) {
    components.set(node.id, createComponent(node, config, tracker))
  }

  const topsortOrder = toposort(config.nodes)
  const reverseOrder = [...topsortOrder].reverse()

  let lastPostTime = 0
  const POST_INTERVAL = 16
  let t = 0
  const step = config.timeStepMs
  const end = config.totalDurationMs

  function processBatch() {
    if (shouldStop()) {
      onComplete(tracker.getResults())
      return
    }
    if (isPaused()) {
      setTimeout(processBatch, 50)
      return
    }

    const batchEnd = Math.min(t + step * 50, end)

    while (t <= batchEnd) {
      if (shouldStop()) {
        onComplete(tracker.getResults())
        return
      }

      for (const nodeId of reverseOrder) {
        const node = nodeMap.get(nodeId)!
        const comp = components.get(nodeId)!

        if (node.config.type === 'queue') {
          const q = comp as BoundedQueue
          q.resetTickCounters()
          for (const successorId of node.successors) {
            const successor = components.get(successorId)!
            while (true) {
              const msg = q.peek()
              if (!msg) break
              if (!successor.receive(msg, t)) break
              q.shiftOne(t)
            }
          }
        } else {
          const output = comp.tick(t, step)

          if (node.successors.length === 0) {
            for (const msg of output) {
              if (!msg.rejected) {
                msg.completedAtMs = t
                tracker.recordLatency(msg.clientId, hgpLatency(msg, topsortOrder, nodeMap))
                tracker.recordE2eLatency(msg.clientId, t - msg.createdAtMs)
              }
            }
          } else {
            for (const successorId of node.successors) {
              const successor = components.get(successorId)!
              const successorNode = nodeMap.get(successorId)!
              for (const msg of output) {
                if (msg.rejected) continue
                if (!successor.receive(msg, t)) {
                  msg.rejected = true
                  msg.rejectedReason = successorNode.config.type === 'queue' ? 'queue_full' : 'rate_limited'
                  // Both queue overflow and downstream TPS rejection are pipeline-side drops,
                  // not gateway rejections — they belong in queueRejected, not totalRejected.
                  tracker.recordQueueRejected(msg.clientId)
                }
              }
            }
          }
        }
      }

      const now = performance.now()
      if (now - lastPostTime >= POST_INTERVAL || t >= end) {
        const nodeMetrics: TickMetrics['nodeMetrics'] = {}
        for (const [id, comp] of components) {
          nodeMetrics[id] = comp.metrics
        }
        onTick({ currentTimeMs: t, nodeMetrics })
        lastPostTime = now
      }

      t += step
    }

    if (t > end) {
      onComplete(tracker.getResults())
    } else {
      setTimeout(processBatch, config.batchSleepMs)
    }
  }

  processBatch()
}

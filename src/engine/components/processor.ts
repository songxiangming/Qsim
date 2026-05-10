import type { PaymentMessage, NodeMetrics } from '@/types/simulation'
import type { PipelineComponent } from '../pipeline-component'

interface InFlightMessage {
  message: PaymentMessage
  completesAtMs: number
}

export class Processor implements PipelineComponent {
  private inFlight: InFlightMessage[] = []
  private tokenAccumulator = 0
  private readonly latencyMs: number
  private readonly tps: number | undefined

  constructor(
    readonly nodeId: string,
    config: { processingLatencyMs: number; throughputPerSecond?: number },
  ) {
    this.latencyMs = config.processingLatencyMs
    this.tps = config.throughputPerSecond
  }

  receive(msg: PaymentMessage, t: number): boolean {
    if (this.tps !== undefined) {
      if (this.tokenAccumulator < 1) return false
      this.tokenAccumulator -= 1
    }
    msg.nodeEntryMs[this.nodeId] = t
    this.inFlight.push({ message: msg, completesAtMs: t + this.latencyMs })
    return true
  }

  tick(t: number, step: number): PaymentMessage[] {
    if (this.tps !== undefined) {
      this.tokenAccumulator = Math.min(
        this.tokenAccumulator + this.tps * (step / 1000),
        this.tps,
      )
    }

    const completed: PaymentMessage[] = []
    const remaining: InFlightMessage[] = []
    for (const entry of this.inFlight) {
      if (entry.completesAtMs <= t) {
        entry.message.nodeExitMs[this.nodeId] = t
        completed.push(entry.message)
      } else {
        remaining.push(entry)
      }
    }
    this.inFlight = remaining
    return completed
  }

  get metrics(): NodeMetrics {
    return { inFlight: this.inFlight.length }
  }
}

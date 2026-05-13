import type { PaymentMessage, NodeMetrics } from '@/types/simulation'
import type { PipelineComponent } from '../pipeline-component'

export class BoundedQueue implements PipelineComponent {
  private messages: PaymentMessage[] = []
  private readonly maxDepth: number
  totalRejected = 0
  rejectedThisTick = 0

  constructor(
    readonly nodeId: string,
    config: { maxDepth: number },
  ) {
    this.maxDepth = config.maxDepth
  }

  receive(msg: PaymentMessage, t: number): boolean {
    if (this.messages.length >= this.maxDepth) {
      this.totalRejected++
      this.rejectedThisTick++
      return false
    }
    msg.nodeEntryMs[this.nodeId] = t
    this.messages.push(msg)
    return true
  }

  tick(_t: number, _step: number): PaymentMessage[] {
    return []
  }

  resetTickCounters() {
    this.rejectedThisTick = 0
  }

  peek(): PaymentMessage | undefined {
    return this.messages[0]
  }

  shiftOne(t: number): PaymentMessage {
    const msg = this.messages.shift()!
    msg.nodeExitMs[this.nodeId] = t
    return msg
  }

  get metrics(): NodeMetrics {
    return {
      depth: this.messages.length,
      totalRejected: this.totalRejected,
      rejectedThisTick: this.rejectedThisTick,
    }
  }
}

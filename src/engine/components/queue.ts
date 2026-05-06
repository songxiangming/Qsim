import type { PaymentMessage } from '@/types/simulation'
import type { QueueConfig } from '@/types/config'

export class BoundedQueue {
  private messages: PaymentMessage[] = []
  private maxDepth: number

  constructor(config: QueueConfig) {
    this.maxDepth = config.maxDepth
  }

  enqueue(msg: PaymentMessage): boolean {
    if (this.messages.length >= this.maxDepth) return false
    this.messages.push(msg)
    return true
  }

  dequeue(): PaymentMessage | undefined {
    return this.messages.shift()
  }

  get depth(): number {
    return this.messages.length
  }
}

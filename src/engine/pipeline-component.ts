import type { PaymentMessage, NodeMetrics } from '@/types/simulation'

export interface PipelineComponent {
  readonly nodeId: string
  /** Push a message in. Returns false if rejected (rate limit exceeded or queue full). */
  receive(msg: PaymentMessage, t: number): boolean
  /** Advance one tick; return messages ready to forward to successors. */
  tick(t: number, step: number): PaymentMessage[]
  readonly metrics: NodeMetrics
}

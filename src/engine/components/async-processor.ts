import type { PaymentMessage } from '@/types/simulation'
import type { AsyncProcessorConfig } from '@/types/config'

interface InFlightMessage {
  message: PaymentMessage
  completesAtMs: number
}

export class AsyncProcessor {
  private inFlight: InFlightMessage[] = []
  private latencyMs: number

  constructor(config: AsyncProcessorConfig) {
    this.latencyMs = config.processingLatencyMs
  }

  accept(msg: PaymentMessage, currentTimeMs: number) {
    msg.asyncProcessorEntryMs = currentTimeMs
    this.inFlight.push({
      message: msg,
      completesAtMs: currentTimeMs + this.latencyMs,
    })
  }

  collectCompleted(currentTimeMs: number): PaymentMessage[] {
    const completed: PaymentMessage[] = []
    const remaining: InFlightMessage[] = []
    for (const entry of this.inFlight) {
      if (entry.completesAtMs <= currentTimeMs) {
        entry.message.asyncProcessorDoneMs = currentTimeMs
        completed.push(entry.message)
      } else {
        remaining.push(entry)
      }
    }
    this.inFlight = remaining
    return completed
  }

  get inFlightCount(): number {
    return this.inFlight.length
  }
}

import type { PaymentMessage } from '@/types/simulation'
import type { PreprocessorConfig } from '@/types/config'

interface InFlightMessage {
  message: PaymentMessage
  completesAtMs: number
}

export class Preprocessor {
  private inFlight: InFlightMessage[] = []
  private latencyMs: number

  constructor(config: PreprocessorConfig) {
    this.latencyMs = config.processingLatencyMs
  }

  accept(msg: PaymentMessage, currentTimeMs: number) {
    msg.preprocessorEntryMs = currentTimeMs
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
        entry.message.preprocessorDoneMs = currentTimeMs
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

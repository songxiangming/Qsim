import type { PaymentMessage } from '@/types/simulation'
import type { BosConfig } from '@/types/config'

interface InFlightMessage {
  message: PaymentMessage
  completesAtMs: number
}

export class Bos {
  private inFlight: InFlightMessage[] = []
  private throughputPerSecond: number
  private latencyMs: number
  private tokenAccumulator = 0

  constructor(config: BosConfig) {
    this.throughputPerSecond = config.throughputPerSecond
    this.latencyMs = config.processingLatencyMs
  }

  tick(currentTimeMs: number, timeStepMs: number, dequeue: () => PaymentMessage | undefined): PaymentMessage[] {
    const completed: PaymentMessage[] = []
    const remaining: InFlightMessage[] = []

    for (const entry of this.inFlight) {
      if (entry.completesAtMs <= currentTimeMs) {
        entry.message.completedAtMs = currentTimeMs
        completed.push(entry.message)
      } else {
        remaining.push(entry)
      }
    }
    this.inFlight = remaining

    this.tokenAccumulator += this.throughputPerSecond * (timeStepMs / 1000)
    while (this.tokenAccumulator >= 1) {
      const msg = dequeue()
      if (!msg) break
      msg.bosEntryMs = currentTimeMs
      this.inFlight.push({
        message: msg,
        completesAtMs: currentTimeMs + this.latencyMs,
      })
      this.tokenAccumulator -= 1
    }

    return completed
  }

  get inFlightCount(): number {
    return this.inFlight.length
  }
}

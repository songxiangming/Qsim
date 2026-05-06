import type { ClientConfig, WorkloadPattern } from '@/types/config'

interface ClientState {
  config: ClientConfig
  accumulator: number
  burstActiveUntilMs: number
  nextBurstAtMs: number
}

export class WorkloadGenerator {
  private clients: ClientState[] = []

  constructor(configs: ClientConfig[]) {
    this.clients = configs.map((config) => ({
      config,
      accumulator: 0,
      burstActiveUntilMs: 0,
      nextBurstAtMs: this.getInitialBurstTime(config.workload),
    }))
  }

  generateRequests(currentTimeMs: number, timeStepMs: number): Map<string, number> {
    const requests = new Map<string, number>()

    for (const client of this.clients) {
      const rps = this.getCurrentRps(client, currentTimeMs)
      client.accumulator += rps * (timeStepMs / 1000)
      const count = Math.floor(client.accumulator)
      client.accumulator -= count
      if (count > 0) {
        requests.set(client.config.id, count)
      }
    }

    return requests
  }

  private getCurrentRps(client: ClientState, currentTimeMs: number): number {
    const wl = client.config.workload
    if (wl.type === 'stable') return wl.requestsPerSecond

    if (currentTimeMs >= client.burstActiveUntilMs && currentTimeMs >= client.nextBurstAtMs) {
      client.burstActiveUntilMs = currentTimeMs + wl.burstDurationMs
      client.nextBurstAtMs = currentTimeMs + wl.burstIntervalMs
    }

    return currentTimeMs < client.burstActiveUntilMs
      ? wl.burstRequestsPerSecond
      : wl.baseRequestsPerSecond
  }

  private getInitialBurstTime(wl: WorkloadPattern): number {
    return wl.type === 'burst' ? wl.burstIntervalMs : Infinity
  }
}

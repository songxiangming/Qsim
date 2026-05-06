import type { ClientConfig } from '@/types/config'

interface ClientState {
  config: ClientConfig
  accumulator: number
  burstStart: number
  burstEnd: number
  nextBurstStart: number
}

export class WorkloadGenerator {
  private clients: ClientState[] = []

  constructor(configs: ClientConfig[]) {
    this.clients = configs.map((config) => {
      const wl = config.workload
      if (wl.type === 'burst') {
        return {
          config,
          accumulator: 0,
          burstStart: 0,
          burstEnd: wl.burstDurationMs,
          nextBurstStart: wl.burstIntervalMs,
        }
      }
      return {
        config,
        accumulator: 0,
        burstStart: -1,
        burstEnd: -1,
        nextBurstStart: Infinity,
      }
    })
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

    if (currentTimeMs >= client.nextBurstStart) {
      client.burstStart = client.nextBurstStart
      client.burstEnd = client.burstStart + wl.burstDurationMs
      client.nextBurstStart = client.burstStart + wl.burstIntervalMs
    }

    return currentTimeMs >= client.burstStart && currentTimeMs < client.burstEnd
      ? wl.burstRequestsPerSecond
      : wl.baseRequestsPerSecond
  }
}

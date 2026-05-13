import type { ClientResults } from '@/types/simulation'

interface ClientRecord {
  clientName: string
  tierName: string
  totalSent: number
  totalRejected: number
  queueRejected: number
  latencies: number[]
  e2eLatencies: number[]
}

export class MetricsTracker {
  private records = new Map<string, ClientRecord>()

  registerClient(clientId: string, clientName: string, tierName: string) {
    this.records.set(clientId, {
      clientName,
      tierName,
      totalSent: 0,
      totalRejected: 0,
      queueRejected: 0,
      latencies: [],
      e2eLatencies: [],
    })
  }

  recordSent(clientId: string) {
    this.records.get(clientId)!.totalSent++
  }

  recordRejected(clientId: string) {
    this.records.get(clientId)!.totalRejected++
  }

  recordQueueRejected(clientId: string) {
    this.records.get(clientId)!.queueRejected++
  }

  recordLatency(clientId: string, latencyMs: number) {
    this.records.get(clientId)!.latencies.push(latencyMs)
  }

  recordE2eLatency(clientId: string, latencyMs: number) {
    this.records.get(clientId)!.e2eLatencies.push(latencyMs)
  }

  getResults(): ClientResults[] {
    const results: ClientResults[] = []
    for (const [clientId, rec] of this.records) {
      const sorted = rec.latencies.slice().sort((a, b) => a - b)
      const sortedE2e = rec.e2eLatencies.slice().sort((a, b) => a - b)
      results.push({
        clientId,
        clientName: rec.clientName,
        tierName: rec.tierName,
        totalSent: rec.totalSent,
        totalSuccessful: sorted.length,
        totalRejected: rec.totalRejected,
        queueRejected: rec.queueRejected,
        p95LatencyMs: percentile(sorted, 0.95),
        p95E2eLatencyMs: percentile(sortedE2e, 0.95),
      })
    }
    return results
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

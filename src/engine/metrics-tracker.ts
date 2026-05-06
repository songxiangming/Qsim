import type { ClientResults } from '@/types/simulation'

interface ClientRecord {
  clientName: string
  tierName: string
  totalSent: number
  totalRejected: number
  latencies: number[]
}

export class MetricsTracker {
  private records = new Map<string, ClientRecord>()

  registerClient(clientId: string, clientName: string, tierName: string) {
    this.records.set(clientId, {
      clientName,
      tierName,
      totalSent: 0,
      totalRejected: 0,
      latencies: [],
    })
  }

  recordSent(clientId: string) {
    this.records.get(clientId)!.totalSent++
  }

  recordRejected(clientId: string) {
    this.records.get(clientId)!.totalRejected++
  }

  recordLatency(clientId: string, latencyMs: number) {
    this.records.get(clientId)!.latencies.push(latencyMs)
  }

  getResults(): ClientResults[] {
    const results: ClientResults[] = []
    for (const [clientId, rec] of this.records) {
      const sorted = rec.latencies.slice().sort((a, b) => a - b)
      results.push({
        clientId,
        clientName: rec.clientName,
        tierName: rec.tierName,
        totalSent: rec.totalSent,
        totalSuccessful: sorted.length,
        totalRejected: rec.totalRejected,
        p50LatencyMs: percentile(sorted, 0.5),
        p95LatencyMs: percentile(sorted, 0.95),
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

<script setup lang="ts">
import type { ClientResults } from '@/types/simulation'

defineProps<{ results: ClientResults[] }>()
</script>

<template>
  <div class="results-section">
    <h3>Client Results</h3>
    <table>
      <thead>
        <tr>
          <th>Client</th>
          <th>Tier</th>
          <th>Sent</th>
          <th>Successful</th>
          <th>Rejected</th>
          <th>p50 Latency</th>
          <th>p95 Latency</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in results" :key="r.clientId">
          <td>{{ r.clientName }}</td>
          <td><span class="tier-badge">{{ r.tierName }}</span></td>
          <td>{{ r.totalSent.toLocaleString() }}</td>
          <td class="success">{{ r.totalSuccessful.toLocaleString() }}</td>
          <td :class="{ danger: r.totalRejected > 0 }">{{ r.totalRejected.toLocaleString() }}</td>
          <td class="mono">{{ r.p50LatencyMs.toFixed(0) }}ms</td>
          <td class="mono">{{ r.p95LatencyMs.toFixed(0) }}ms</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.results-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.results-section h3 {
  padding: 14px 20px;
  font-size: 14px;
  border-bottom: 1px solid var(--border);
}

.tier-badge {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--surface-2);
  font-size: 12px;
  font-weight: 500;
}

.success {
  color: var(--success);
}

.danger {
  color: var(--danger);
}

.mono {
  font-family: var(--mono);
}
</style>

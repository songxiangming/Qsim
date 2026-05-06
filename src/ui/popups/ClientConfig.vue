<script setup lang="ts">
import type { SimulationConfig, WorkloadPattern } from '@/types/config'
import PopupOverlay from './PopupOverlay.vue'

const props = defineProps<{ config: SimulationConfig }>()
defineEmits<{ close: [] }>()

function addClient() {
  const id = `client-${Date.now()}`
  props.config.clients.push({
    id,
    name: `Client ${props.config.clients.length + 1}`,
    tierId: props.config.tiers[0]?.id || '',
    workload: { type: 'stable', requestsPerSecond: 10 },
  })
}

function removeClient(idx: number) {
  props.config.clients.splice(idx, 1)
}

function setWorkloadType(idx: number, type: 'stable' | 'burst') {
  const client = props.config.clients[idx]
  if (type === 'stable') {
    client.workload = { type: 'stable', requestsPerSecond: 10 }
  } else {
    client.workload = {
      type: 'burst',
      baseRequestsPerSecond: 10,
      burstRequestsPerSecond: 50,
      burstDurationMs: 2000,
      burstIntervalMs: 10000,
    }
  }
}

function asBurst(wl: WorkloadPattern) {
  return wl as Extract<WorkloadPattern, { type: 'burst' }>
}
</script>

<template>
  <PopupOverlay title="Client Configuration" @close="$emit('close')">
    <div v-for="(client, i) in config.clients" :key="client.id" class="client-card">
      <div class="client-header">
        <label>
          Name
          <input v-model="client.name" type="text" />
        </label>
        <label>
          Tier
          <select v-model="client.tierId">
            <option v-for="tier in config.tiers" :key="tier.id" :value="tier.id">{{ tier.name }}</option>
          </select>
        </label>
        <button class="remove-btn" @click="removeClient(i)">&times;</button>
      </div>

      <div class="workload-section">
        <div class="workload-type">
          <label class="radio-label">
            <input
              type="radio"
              :name="`wl-${client.id}`"
              value="stable"
              :checked="client.workload.type === 'stable'"
              @change="setWorkloadType(i, 'stable')"
            />
            Stable
          </label>
          <label class="radio-label">
            <input
              type="radio"
              :name="`wl-${client.id}`"
              value="burst"
              :checked="client.workload.type === 'burst'"
              @change="setWorkloadType(i, 'burst')"
            />
            Burst
          </label>
        </div>

        <div v-if="client.workload.type === 'stable'" class="fields">
          <label>
            Requests/sec
            <input v-model.number="client.workload.requestsPerSecond" type="number" min="0" />
          </label>
        </div>

        <div v-else class="fields burst-fields">
          <label>
            Base RPS
            <input v-model.number="asBurst(client.workload).baseRequestsPerSecond" type="number" min="0" />
          </label>
          <label>
            Burst RPS
            <input v-model.number="asBurst(client.workload).burstRequestsPerSecond" type="number" min="0" />
          </label>
          <label>
            Burst Duration (ms)
            <input v-model.number="asBurst(client.workload).burstDurationMs" type="number" min="100" step="100" />
          </label>
          <label>
            Burst Interval (ms)
            <input v-model.number="asBurst(client.workload).burstIntervalMs" type="number" min="100" step="100" />
          </label>
        </div>
      </div>
    </div>
    <button class="add-btn" @click="addClient">+ Add Client</button>
  </PopupOverlay>
</template>

<style scoped>
.client-card {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.client-header {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.workload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workload-type {
  display: flex;
  gap: 16px;
}

.radio-label {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text);
  text-transform: none;
  letter-spacing: 0;
  cursor: pointer;
}

.fields {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.burst-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 20px;
  padding: 0 6px;
  flex-shrink: 0;
}

.add-btn {
  padding: 8px 16px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
}

.add-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}
</style>

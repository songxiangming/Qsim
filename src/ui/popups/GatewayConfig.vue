<script setup lang="ts">
import type { SimulationConfig } from '@/types/config'
import PopupOverlay from './PopupOverlay.vue'

const props = defineProps<{ config: SimulationConfig }>()
defineEmits<{ close: [] }>()

function addTier() {
  const id = `tier-${Date.now()}`
  props.config.tiers.push({
    id,
    name: 'New Tier',
    averageRateLimit: { windowMs: 1000, maxRequests: 10 },
    peakRateLimit: { windowMs: 500, maxRequests: 20 },
  })
}

function removeTier(idx: number) {
  props.config.tiers.splice(idx, 1)
}
</script>

<template>
  <PopupOverlay title="API Gateway — Rate Limit Tiers" @close="$emit('close')">
    <div v-for="(tier, i) in config.tiers" :key="tier.id" class="tier-card">
      <div class="tier-header">
        <label>
          Name
          <input v-model="tier.name" type="text" />
        </label>
        <button class="remove-btn" @click="removeTier(i)">&times;</button>
      </div>
      <div class="rate-group">
        <strong>Average Rate Limit</strong>
        <div class="fields">
          <label>
            Max Requests
            <input v-model.number="tier.averageRateLimit.maxRequests" type="number" min="1" />
          </label>
          <label>
            Window (ms)
            <input v-model.number="tier.averageRateLimit.windowMs" type="number" min="100" step="100" />
          </label>
        </div>
      </div>
      <div class="rate-group">
        <strong>Peak Rate Limit</strong>
        <div class="fields">
          <label>
            Max Requests
            <input v-model.number="tier.peakRateLimit.maxRequests" type="number" min="1" />
          </label>
          <label>
            Window (ms)
            <input v-model.number="tier.peakRateLimit.windowMs" type="number" min="100" step="100" />
          </label>
        </div>
      </div>
    </div>
    <button class="add-btn" @click="addTier">+ Add Tier</button>
  </PopupOverlay>
</template>

<style scoped>
.tier-card {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tier-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.rate-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rate-group strong {
  font-size: 12px;
  color: var(--text-muted);
}

.fields {
  display: flex;
  gap: 12px;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 20px;
  padding: 0 6px;
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

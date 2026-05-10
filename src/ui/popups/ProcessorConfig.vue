<script setup lang="ts">
import type { PipelineNode } from '@/types/config'
import PopupOverlay from './PopupOverlay.vue'

const props = defineProps<{ node: PipelineNode; title: string }>()
defineEmits<{ close: [] }>()

function cfg() {
  return props.node.config as { type: 'processor'; name: string; processingLatencyMs: number; throughputPerSecond?: number }
}

function toggleRateLimit() {
  const c = cfg()
  if (c.throughputPerSecond !== undefined) {
    delete c.throughputPerSecond
  } else {
    c.throughputPerSecond = 10
  }
}
</script>

<template>
  <PopupOverlay :title="title" @close="$emit('close')">
    <label>
      Name
      <input v-model="(node.config as any).name" type="text" placeholder="Processor" />
    </label>
    <label>
      Processing Latency (ms)
      <input v-model.number="(node.config as any).processingLatencyMs" type="number" min="0" step="10" />
    </label>
    <div class="rate-limit-section">
      <div class="rate-limit-header">
        <span>Rate Limit</span>
        <label class="toggle-label">
          <input
            type="checkbox"
            :checked="cfg().throughputPerSecond !== undefined"
            @change="toggleRateLimit"
          />
          Enabled
        </label>
      </div>
      <template v-if="cfg().throughputPerSecond !== undefined">
        <label>
          Throughput (req/s)
          <input v-model.number="(node.config as any).throughputPerSecond" type="number" min="1" step="1" />
        </label>
        <p class="hint">Excess requests beyond the limit are dropped.</p>
      </template>
    </div>
  </PopupOverlay>
</template>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.rate-limit-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-2);
}

.rate-limit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
}

.toggle-label {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
  cursor: pointer;
}
</style>

<script setup lang="ts">
import type { SimulationConfig } from '@/types/config'
import PopupOverlay from './PopupOverlay.vue'

defineProps<{ config: SimulationConfig }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <PopupOverlay title="Async Processor" @close="$emit('close')">
    <label>
      Processing Latency (ms)
      <input v-model.number="config.asyncProcessor.processingLatencyMs" type="number" min="0" step="10" />
    </label>
    <p class="hint">Throughput is unlimited. All incoming requests are processed in parallel.</p>
  </PopupOverlay>
</template>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--text-muted);
}
</style>

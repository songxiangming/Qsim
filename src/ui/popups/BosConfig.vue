<script setup lang="ts">
import type { SimulationConfig } from '@/types/config'
import PopupOverlay from './PopupOverlay.vue'

defineProps<{ config: SimulationConfig }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <PopupOverlay title="Back Office System (BOS)" @close="$emit('close')">
    <label>
      Throughput (requests/sec)
      <input v-model.number="config.bos.throughputPerSecond" type="number" min="1" />
    </label>
    <label>
      Processing Latency (ms)
      <input v-model.number="config.bos.processingLatencyMs" type="number" min="0" step="10" />
    </label>
  </PopupOverlay>
</template>

<script setup lang="ts">
import type { QueueConfig } from '@/types/config'
import PopupOverlay from './PopupOverlay.vue'

defineProps<{ title: string; queue: QueueConfig }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <PopupOverlay :title="title" @close="$emit('close')">
    <label>
      Max Queue Depth
      <input v-model.number="queue.maxDepth" type="number" min="1" step="10" />
    </label>
    <p class="hint">Messages exceeding max depth will be rejected (backpressure).</p>
  </PopupOverlay>
</template>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--text-muted);
}
</style>

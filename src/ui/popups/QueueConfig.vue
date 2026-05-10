<script setup lang="ts">
import type { PipelineNode } from '@/types/config'
import PopupOverlay from './PopupOverlay.vue'

defineProps<{ title: string; node: PipelineNode }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <PopupOverlay :title="title" @close="$emit('close')">
    <label>
      Max Queue Depth
      <input v-model.number="(node.config as any).maxDepth" type="number" min="1" step="10" />
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

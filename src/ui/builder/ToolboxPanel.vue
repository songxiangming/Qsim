<script setup lang="ts">
import { TOOLBOX_ITEMS } from '@/types/builder'
import type { BuilderNodeType } from '@/types/builder'

function onDragStart(e: DragEvent, type: BuilderNodeType) {
  e.dataTransfer!.setData('text/plain', type)
  e.dataTransfer!.effectAllowed = 'copy'
}
</script>

<template>
  <aside class="toolbox">
    <h3 class="toolbox-title">Components</h3>
    <div class="toolbox-items">
      <div
        v-for="item in TOOLBOX_ITEMS"
        :key="item.type"
        class="toolbox-item"
        :style="{ '--item-color': item.color }"
        draggable="true"
        @dragstart="onDragStart($event, item.type)"
      >
        <span class="item-dot" />
        {{ item.label }}
      </div>
    </div>
    <p class="toolbox-hint">Drag onto the canvas to build your pipeline.</p>
  </aside>
</template>

<style scoped>
.toolbox {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  height: fit-content;
}

.toolbox-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 0;
}

.toolbox-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1.5px dashed var(--item-color, var(--border));
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  cursor: grab;
  user-select: none;
  transition: background 0.12s;
}

.toolbox-item:hover {
  background: var(--hover);
}

.toolbox-item:active {
  cursor: grabbing;
}

.item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--item-color, var(--border));
  flex-shrink: 0;
}

.toolbox-hint {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}
</style>

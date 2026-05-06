<script setup lang="ts">
defineProps<{
  label: string
  subtitle?: string
  color?: string
  clickable?: boolean
  compact?: boolean
  fillPercent?: number
  fillColor?: string
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <div
    :class="['component-box', { clickable, compact }]"
    :style="{ '--accent': color || 'var(--primary)' }"
    @click="clickable && $emit('click')"
  >
    <div
      v-if="fillPercent != null"
      class="fill-bar"
      :style="{
        height: Math.min(100, fillPercent) + '%',
        background: fillColor || color || 'var(--primary)',
      }"
    />
    <div class="box-content">
      <div class="box-label">{{ label }}</div>
      <div v-if="subtitle" class="box-subtitle">{{ subtitle }}</div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.component-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 16px 20px;
  border: 2px solid var(--accent);
  border-radius: 10px;
  background: var(--surface);
  gap: 4px;
  transition: all 0.15s;
  overflow: hidden;
}

.component-box.compact {
  min-width: 80px;
  padding: 12px 14px;
}

.component-box.clickable {
  cursor: pointer;
}

.component-box.clickable:hover {
  background: var(--surface-2);
  box-shadow: 0 0 16px rgba(79, 109, 245, 0.15);
  transform: translateY(-1px);
}

.fill-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0.2;
  transition: height 0.15s linear;
  pointer-events: none;
}

.box-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 1;
}

.box-label {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}

.box-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>

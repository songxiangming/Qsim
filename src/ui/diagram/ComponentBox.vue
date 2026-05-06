<script setup lang="ts">
defineProps<{
  label: string
  subtitle?: string
  color?: string
  clickable?: boolean
  compact?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <div
    :class="['component-box', { clickable, compact }]"
    :style="{ '--accent': color || 'var(--primary)' }"
    @click="clickable && $emit('click')"
  >
    <div class="box-label">{{ label }}</div>
    <div v-if="subtitle" class="box-subtitle">{{ subtitle }}</div>
    <slot />
  </div>
</template>

<style scoped>
.component-box {
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

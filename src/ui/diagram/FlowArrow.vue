<script setup lang="ts">
</script>

<template>
  <svg class="arrow" viewBox="0 0 40 20" preserveAspectRatio="none">
    <defs>
      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="var(--border)" />
      </marker>
    </defs>
    <line x1="0" y1="10" x2="34" y2="10" stroke="var(--border)" stroke-width="2" marker-end="url(#arrowhead)" />
  </svg>
</template>

<style scoped>
.arrow {
  width: 40px;
  height: 20px;
  flex-shrink: 0;
  align-self: center;
}
</style>

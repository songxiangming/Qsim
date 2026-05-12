<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  recentFiles: { name: string; savedAt: string }[]
  currentFileName: string | null
}>()

const emit = defineEmits<{
  open: []
  save: []
  openRecent: [index: number]
}>()

const menuOpen = ref(false)
const menuEl = ref<HTMLElement>()

function toggle() { menuOpen.value = !menuOpen.value }
function close() { menuOpen.value = false }

// capture phase so we catch clicks inside dropdowns before they stop propagation
function onDocClick(e: MouseEvent) {
  if (!menuEl.value?.contains(e.target as Node)) close()
}
onMounted(() => document.addEventListener('click', onDocClick, true))
onUnmounted(() => document.removeEventListener('click', onDocClick, true))

function fmt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="menu-bar">
    <div ref="menuEl" class="file-menu">
      <button class="trigger" :class="{ active: menuOpen }" @click.stop="toggle">
        File
      </button>

      <div v-if="menuOpen" class="dropdown">
        <button class="item" @click="close(); emit('open')">Open…</button>
        <button class="item" @click="close(); emit('save')">Save</button>

        <div class="sep" />
        <div class="group-label">Recent Files</div>

        <template v-if="recentFiles.length">
          <button
            v-for="(f, i) in recentFiles"
            :key="f.name"
            class="item recent"
            @click="close(); emit('openRecent', i)"
          >
            <span class="r-name">{{ f.name }}</span>
            <span class="r-date">{{ fmt(f.savedAt) }}</span>
          </button>
        </template>
        <div v-else class="empty">No recent files</div>
      </div>
    </div>
    <span class="file-name" :class="{ unsaved: !currentFileName }">
      {{ currentFileName ?? 'not saved' }}
    </span>
  </div>
</template>

<style scoped>
.menu-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.file-name {
  font-size: 13px;
  color: var(--text);
  font-family: var(--mono);
}

.file-name.unsaved {
  color: var(--text-muted);
  font-style: italic;
}

.file-menu {
  position: relative;
}

.trigger {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.1s;
}

.trigger:hover,
.trigger.active {
  background: var(--surface-2);
}

.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 240px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 4px;
  z-index: 200;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  text-align: left;
  border-radius: 5px;
  cursor: pointer;
  gap: 12px;
  transition: background 0.1s;
}

.item:hover {
  background: color-mix(in srgb, var(--primary) 12%, var(--surface-2));
}

.recent.item {
  flex-wrap: nowrap;
}

.r-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-date {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.sep {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.group-label {
  padding: 4px 10px 2px;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.empty {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}
</style>

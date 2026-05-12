<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { DAGPipelineConfig } from './types/config'
import { createDefaultConfig } from './config/defaults'
import BuilderTab from './ui/tabs/BuilderTab.vue'
import SimulationTab from './ui/tabs/SimulationTab.vue'

const activeTab = ref<'builder' | 'simulation'>('builder')
const config = reactive<DAGPipelineConfig>(createDefaultConfig())

function onApplyBuilderConfig(newConfig: DAGPipelineConfig) {
  config.nodes.splice(0, config.nodes.length, ...newConfig.nodes)
  config.tiers = newConfig.tiers
  config.clients = newConfig.clients
  config.timeStepMs = newConfig.timeStepMs
  config.totalDurationMs = newConfig.totalDurationMs
  config.batchSleepMs = newConfig.batchSleepMs
  activeTab.value = 'simulation'
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>QSim</h1>
      <nav class="tab-bar">
        <button
          :class="['tab-btn', { active: activeTab === 'builder' }]"
          @click="activeTab = 'builder'"
        >
          Builder
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'simulation' }]"
          @click="activeTab = 'simulation'"
        >
          Simulation
        </button>
      </nav>
    </header>
    <main class="app-content">
      <BuilderTab v-if="activeTab === 'builder'" :config="config" @apply="onApplyBuilderConfig" />
      <SimulationTab v-else :config="config" />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.tab-bar {
  display: flex;
  gap: 4px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: var(--hover);
}

.tab-btn.active {
  background: var(--primary);
  color: white;
}

.app-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { DAGPipelineConfig } from '@/types/config'
import { useSimulation } from '../composables/useSimulation'
import SystemDiagram from '../diagram/SystemDiagram.vue'
import ResultsTable from '../controls/ResultsTable.vue'

const props = defineProps<{ config: DAGPipelineConfig }>()

const { metrics, results, running, paused, start, stop, pause, resume } = useSimulation()

function handlePauseResume() {
  if (paused.value) resume()
  else pause()
}

const progress = computed(() => {
  if (!metrics.value) return 0
  return Math.min(100, (metrics.value.currentTimeMs / props.config.totalDurationMs) * 100)
})

const elapsed = computed(() => {
  if (!metrics.value) return '0.0s'
  return (metrics.value.currentTimeMs / 1000).toFixed(1) + 's'
})

const axisTicks = computed(() => {
  const totalSec = props.config.totalDurationMs / 1000
  const bases = [1, 2, 5]
  let magnitude = 1
  let interval = 1
  outer: while (true) {
    for (const b of bases) {
      interval = b * magnitude
      if (totalSec / interval <= 15) break outer
    }
    magnitude *= 10
  }
  const ticks: { sec: number; pct: number }[] = []
  for (let s = interval; s < totalSec; s += interval) {
    ticks.push({ sec: s, pct: (s / totalSec) * 100 })
  }
  return ticks
})
</script>

<template>
  <div class="simulation-tab">
    <section class="controls">
      <div class="control-fields">
        <label>
          Time Step (ms)
          <input v-model.number="config.timeStepMs" type="number" min="10" step="10" :disabled="running" />
        </label>
        <label>
          Total Duration (ms)
          <input v-model.number="config.totalDurationMs" type="number" min="1000" step="1000" :disabled="running" />
        </label>
        <label>
          Batch Sleep (ms)
          <input v-model.number="config.batchSleepMs" type="number" min="0" step="10" :disabled="running" />
        </label>
      </div>
      <div class="action-buttons">
        <button v-if="!running" class="action-btn" @click="start(config)">Start</button>
        <button v-if="running" :class="['action-btn', paused ? 'resume' : 'pause']" @click="handlePauseResume">
          {{ paused ? 'Resume' : 'Pause' }}
        </button>
        <button v-if="running" class="action-btn stop" @click="stop">Stop</button>
      </div>
    </section>

    <section class="progress-section">
      <div class="time-axis-area">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }" />
        </div>
        <div class="axis-ticks">
          <div v-for="t in axisTicks" :key="t.sec" class="axis-tick" :style="{ left: t.pct + '%' }">
            <div class="tick-mark" />
            <span class="tick-value">{{ t.sec }}s</span>
          </div>
        </div>
      </div>
      <span class="progress-label">{{ elapsed }} / {{ (config.totalDurationMs / 1000).toFixed(1) }}s</span>
    </section>

    <div v-if="metrics" class="tick-label">Tick: {{ metrics.currentTimeMs }}ms</div>

    <SystemDiagram :config="config" :metrics="metrics" mode="simulation" />

    <ResultsTable v-if="results" :results="results" />
  </div>
</template>

<style scoped>
.simulation-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}

.control-fields {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.15s;
}

.action-btn:hover { background: var(--primary-hover); }
.action-btn.pause { background: var(--warning); }
.action-btn.pause:hover { background: #ca9a06; }
.action-btn.resume { background: var(--success); }
.action-btn.resume:hover { background: #16a34a; }
.action-btn.stop { background: var(--danger); }
.action-btn.stop:hover { background: #dc2626; }

.action-buttons {
  display: flex;
  gap: 8px;
}

.progress-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.time-axis-area {
  flex: 1;
  position: relative;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.axis-ticks {
  position: relative;
  height: 20px;
}

.axis-tick {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tick-mark {
  width: 1px;
  height: 5px;
  background: var(--text-muted);
}

.tick-value {
  font-size: 10px;
  font-family: var(--mono);
  color: var(--text-muted);
  white-space: nowrap;
}

.progress-label {
  font-size: 12px;
  font-family: var(--mono);
  color: var(--text-muted);
  white-space: nowrap;
}

.tick-label {
  font-size: 12px;
  font-family: var(--mono);
  color: var(--text-muted);
}
</style>

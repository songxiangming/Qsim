<script setup lang="ts">
import type { SimulationConfig } from '@/types/config'
import type { TickMetrics } from '@/types/simulation'
import ComponentBox from './ComponentBox.vue'
import FlowArrow from './FlowArrow.vue'

defineProps<{
  config: SimulationConfig
  metrics?: TickMetrics | null
  mode: 'config' | 'simulation'
}>()

defineEmits<{
  componentClick: [component: string]
}>()
</script>

<template>
  <div class="diagram">
    <ComponentBox
      label="Clients"
      :subtitle="`${config.clients.length} clients`"
      color="#8b5cf6"
      :clickable="mode === 'config'"
      @click="$emit('componentClick', 'clients')"
    />
    <FlowArrow />
    <ComponentBox
      label="API Gateway"
      :subtitle="mode === 'config' ? `${config.tiers.length} tiers` : undefined"
      color="#ef4444"
      :clickable="mode === 'config'"
      @click="$emit('componentClick', 'gateway')"
    >
      <template v-if="mode === 'simulation' && metrics">
        <div class="metric danger">Rejected: {{ metrics.gatewayTotalRejected }}</div>
        <div class="metric-sub">{{ metrics.gatewayRejectedThisTick }}/tick</div>
      </template>
    </ComponentBox>
    <FlowArrow />
    <ComponentBox
      label="Preprocessor"
      :subtitle="mode === 'config' ? `${config.preprocessor.processingLatencyMs}ms` : undefined"
      color="#f59e0b"
      :clickable="mode === 'config'"
      @click="$emit('componentClick', 'preprocessor')"
    >
      <template v-if="mode === 'simulation' && metrics">
        <div class="metric">In-flight: {{ metrics.preprocessorInFlight }}</div>
      </template>
    </ComponentBox>
    <FlowArrow />
    <div class="queue-wrapper">
      <ComponentBox
        label="Q1"
        :subtitle="mode === 'config' ? `depth: ${config.q1.maxDepth}` : undefined"
        color="#22c55e"
        compact
        :clickable="mode === 'config'"
        :fill-percent="mode === 'simulation' && metrics ? (metrics.q1Depth / config.q1.maxDepth) * 100 : undefined"
        fill-color="#ef4444"
        @click="$emit('componentClick', 'q1')"
      />
      <div v-if="mode === 'simulation' && metrics" class="queue-depth">{{ metrics.q1Depth }}/{{ config.q1.maxDepth }}</div>
    </div>
    <FlowArrow />
    <ComponentBox
      label="Async Proc"
      :subtitle="mode === 'config' ? `${config.asyncProcessor.processingLatencyMs}ms` : undefined"
      color="#06b6d4"
      :clickable="mode === 'config'"
      @click="$emit('componentClick', 'asyncProcessor')"
    >
      <template v-if="mode === 'simulation' && metrics">
        <div class="metric">In-flight: {{ metrics.asyncProcessorInFlight }}</div>
      </template>
    </ComponentBox>
    <FlowArrow />
    <div class="queue-wrapper">
      <ComponentBox
        label="Q2"
        :subtitle="mode === 'config' ? `depth: ${config.q2.maxDepth}` : undefined"
        color="#22c55e"
        compact
        :clickable="mode === 'config'"
        :fill-percent="mode === 'simulation' && metrics ? (metrics.q2Depth / config.q2.maxDepth) * 100 : undefined"
        fill-color="#ef4444"
        @click="$emit('componentClick', 'q2')"
      />
      <div v-if="mode === 'simulation' && metrics" class="queue-depth">{{ metrics.q2Depth }}/{{ config.q2.maxDepth }}</div>
    </div>
    <FlowArrow />
    <ComponentBox
      label="BOS"
      :subtitle="mode === 'config' ? `${config.bos.throughputPerSecond} rps / ${config.bos.processingLatencyMs}ms` : undefined"
      color="#a855f7"
      :clickable="mode === 'config'"
      @click="$emit('componentClick', 'bos')"
    >
      <template v-if="mode === 'simulation' && metrics">
        <div class="metric">In-flight: {{ metrics.bosInFlight }}</div>
      </template>
    </ComponentBox>
  </div>
</template>

<style scoped>
.diagram {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 24px;
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow-x: auto;
}

.metric {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--mono);
  margin-top: 4px;
}

.metric.danger {
  color: var(--danger);
}

.metric-sub {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--mono);
}

.queue-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.queue-depth {
  font-size: 11px;
  font-family: var(--mono);
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>

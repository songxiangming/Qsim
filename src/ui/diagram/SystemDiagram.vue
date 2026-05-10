<script setup lang="ts">
import type { DAGPipelineConfig, PipelineNode, NodeConfig } from '@/types/config'
import type { TickMetrics } from '@/types/simulation'
import ComponentBox from './ComponentBox.vue'
import FlowArrow from './FlowArrow.vue'

const props = defineProps<{
  config: DAGPipelineConfig
  metrics?: TickMetrics | null
  mode: 'config' | 'simulation'
}>()

defineEmits<{
  componentClick: [nodeId: string]
}>()

function nodeColor(cfg: NodeConfig): string {
  switch (cfg.type) {
    case 'gateway':   return '#ef4444'
    case 'processor': return '#f59e0b'
    case 'queue':     return '#22c55e'
  }
}

function nodeLabel(node: PipelineNode, index: number): string {
  switch (node.config.type) {
    case 'gateway':   return 'API Gateway'
    case 'processor': return node.config.name || 'Processor'
    case 'queue':     return queueLabel(node, index)
  }
}

function queueLabel(_node: PipelineNode, index: number): string {
  const queuesBefore = props.config.nodes.slice(0, index).filter((n) => n.config.type === 'queue').length
  return `Q${queuesBefore + 1}`
}

function nodeSubtitle(node: PipelineNode): string {
  switch (node.config.type) {
    case 'gateway':
      return `${props.config.tiers.length} tiers / ${props.config.clients.length} clients`
    case 'processor':
      return node.config.throughputPerSecond !== undefined
        ? `${node.config.processingLatencyMs}ms · ${node.config.throughputPerSecond} rps`
        : `${node.config.processingLatencyMs}ms`
    case 'queue':
      return `depth: ${node.config.maxDepth}`
  }
}

function isQueue(node: PipelineNode): node is PipelineNode & { config: { type: 'queue'; maxDepth: number } } {
  return node.config.type === 'queue'
}
</script>

<template>
  <div class="diagram">
    <template v-for="(node, i) in config.nodes" :key="node.id">
      <FlowArrow v-if="i > 0" />
      <div v-if="isQueue(node)" class="queue-wrapper">
        <ComponentBox
          :label="nodeLabel(node, i)"
          :subtitle="mode === 'config' ? nodeSubtitle(node) : undefined"
          :color="nodeColor(node.config)"
          compact
          :clickable="mode === 'config'"
          :fill-percent="mode === 'simulation' && metrics ? (metrics.nodeMetrics[node.id]?.depth ?? 0) / node.config.maxDepth * 100 : undefined"
          fill-color="#ef4444"
          @click="$emit('componentClick', node.id)"
        />
        <div v-if="mode === 'simulation' && metrics" class="queue-depth">
          {{ metrics.nodeMetrics[node.id]?.depth ?? 0 }}/{{ node.config.maxDepth }}
        </div>
      </div>
      <ComponentBox
        v-else
        :label="nodeLabel(node, i)"
        :subtitle="mode === 'config' ? nodeSubtitle(node) : undefined"
        :color="nodeColor(node.config)"
        :clickable="mode === 'config'"
        @click="$emit('componentClick', node.id)"
      >
        <template v-if="mode === 'simulation' && metrics">
          <template v-if="node.config.type === 'gateway'">
            <div class="metric danger">Rejected: {{ metrics.nodeMetrics[node.id]?.totalRejected ?? 0 }}</div>
            <div class="metric-sub">{{ metrics.nodeMetrics[node.id]?.rejectedThisTick ?? 0 }}/tick</div>
          </template>
          <template v-else>
            <div class="metric">In-flight: {{ metrics.nodeMetrics[node.id]?.inFlight ?? 0 }}</div>
          </template>
        </template>
      </ComponentBox>
    </template>
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

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { DAGPipelineConfig, PipelineNode, NodeConfig } from '@/types/config'
import type { TickMetrics } from '@/types/simulation'
import ComponentBox from './ComponentBox.vue'

const props = defineProps<{
  config: DAGPipelineConfig
  metrics?: TickMetrics | null
  mode: 'config' | 'simulation'
}>()

defineEmits<{
  componentClick: [nodeId: string]
}>()

const canvasRef = ref<HTMLElement>()
const nodeEls = reactive(new Map<string, HTMLElement>())

function setNodeEl(el: unknown, id: string) {
  if (el) nodeEls.set(id, el as HTMLElement)
  else nodeEls.delete(id)
}

function getSize(id: string): { w: number; h: number } {
  const el = nodeEls.get(id)
  return { w: el?.offsetWidth ?? 160, h: el?.offsetHeight ?? 64 }
}

// Apply default positions for any node missing them (e.g. legacy configs)
const positionedNodes = computed(() => {
  return props.config.nodes.map((n, i) => ({
    ...n,
    x: n.x ?? (20 + i * 220),
    y: n.y ?? 80,
  }))
})

const canvasW = computed(() => {
  let max = 600
  for (const n of positionedNodes.value) max = Math.max(max, n.x + 240)
  return max
})
const canvasH = computed(() => {
  let max = 240
  for (const n of positionedNodes.value) max = Math.max(max, n.y + 160)
  return max
})

const edges = computed(() => {
  const list: { from: string; to: string }[] = []
  for (const node of props.config.nodes) {
    for (const s of node.successors) list.push({ from: node.id, to: s })
  }
  return list
})

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
  const queuesBefore = positionedNodes.value.slice(0, index).filter((n) => n.config.type === 'queue').length
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

function queueFillPercent(node: PipelineNode): number | undefined {
  if (props.mode !== 'simulation' || !props.metrics) return undefined
  if (node.config.type !== 'queue') return undefined
  return (props.metrics.nodeMetrics[node.id]?.depth ?? 0) / node.config.maxDepth * 100
}

function edgePath(fromId: string, toId: string): string {
  const src = positionedNodes.value.find(n => n.id === fromId)
  const dst = positionedNodes.value.find(n => n.id === toId)
  if (!src || !dst) return ''
  const { w: sw, h: sh } = getSize(fromId)
  const { h: dh } = getSize(toId)
  const x1 = src.x + sw, y1 = src.y + sh / 2
  const x2 = dst.x,      y2 = dst.y + dh / 2
  const cx = Math.max(60, Math.abs(x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + cx} ${y1} ${x2 - cx} ${y2} ${x2} ${y2}`
}
</script>

<template>
  <div class="canvas-scroll">
    <div
      ref="canvasRef"
      class="canvas-inner"
      :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
    >
      <svg class="edge-layer" :width="canvasW" :height="canvasH" style="pointer-events: none">
        <defs>
          <marker id="diag-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="var(--text-muted)" />
          </marker>
        </defs>
        <path
          v-for="edge in edges"
          :key="`${edge.from}-${edge.to}`"
          :d="edgePath(edge.from, edge.to)"
          fill="none"
          stroke="var(--text-muted)"
          stroke-width="2"
          marker-end="url(#diag-arrow)"
        />
      </svg>

      <div
        v-for="(node, i) in positionedNodes"
        :key="node.id"
        class="node-wrapper"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
        :ref="(el) => setNodeEl(el, node.id)"
      >
        <ComponentBox
          :label="nodeLabel(node, i)"
          :subtitle="mode === 'config' ? nodeSubtitle(node) : undefined"
          :color="nodeColor(node.config)"
          :compact="node.config.type === 'queue'"
          :clickable="mode === 'config'"
          :fill-percent="queueFillPercent(node)"
          fill-color="#ef4444"
          @click="$emit('componentClick', node.id)"
        >
          <template v-if="mode === 'simulation' && metrics">
            <template v-if="node.config.type === 'gateway'">
              <div class="metric danger">Rejected: {{ metrics.nodeMetrics[node.id]?.totalRejected ?? 0 }}</div>
              <div class="metric-sub">{{ metrics.nodeMetrics[node.id]?.rejectedThisTick ?? 0 }}/tick</div>
            </template>
            <template v-else-if="node.config.type === 'queue'">
              <div class="metric-sub">{{ metrics.nodeMetrics[node.id]?.depth ?? 0 }}/{{ node.config.maxDepth }}</div>
              <div v-if="(metrics.nodeMetrics[node.id]?.totalRejected ?? 0) > 0" class="metric danger">
                Dropped: {{ metrics.nodeMetrics[node.id]?.totalRejected }}
              </div>
              <div v-if="(metrics.nodeMetrics[node.id]?.rejectedThisTick ?? 0) > 0" class="metric-sub">
                {{ metrics.nodeMetrics[node.id]?.rejectedThisTick }}/tick
              </div>
            </template>
            <template v-else>
              <div class="metric">In-flight: {{ metrics.nodeMetrics[node.id]?.inFlight ?? 0 }}</div>
            </template>
          </template>
        </ComponentBox>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-scroll {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: auto;
  min-height: 300px;
}

.canvas-inner {
  position: relative;
}

.edge-layer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}

.node-wrapper {
  position: absolute;
  z-index: 1;
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
  font-weight: 600;
}
</style>

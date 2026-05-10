<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { DAGPipelineConfig, PipelineNode } from '@/types/config'
import type { BuilderNode, BuilderEdge, BuilderNodeType } from '@/types/builder'
import { createDefaultConfig } from '@/config/defaults'
import { toposort } from '@/engine/dag'
import ToolboxPanel from '../builder/ToolboxPanel.vue'
import BuilderCanvas from '../builder/BuilderCanvas.vue'
import GatewayConfig from '../popups/GatewayConfig.vue'
import ProcessorConfig from '../popups/ProcessorConfig.vue'
import QueueConfig from '../popups/QueueConfig.vue'
import ClientConfig from '../popups/ClientConfig.vue'

const props = defineProps<{ config: DAGPipelineConfig }>()
const emit = defineEmits<{ apply: [config: DAGPipelineConfig] }>()

const nodes = ref<BuilderNode[]>([])
const edges = ref<BuilderEdge[]>([])
const draftConfig = reactive<DAGPipelineConfig>(JSON.parse(JSON.stringify(props.config)))
const activeNodeId = ref<string | null>(null)
const showClientConfig = ref(false)
const validationErrors = ref<string[]>([])

function makeId(type: BuilderNodeType): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function labelFor(type: BuilderNodeType): string {
  switch (type) {
    case 'gateway':   return 'API Gateway'
    case 'processor': return 'Processor'
    case 'queue':     return 'Queue'
  }
}

onMounted(() => {
  // Rehydrate nodes, preserving original IDs so successors map correctly
  nodes.value = props.config.nodes.map((n, i) => ({
    id: n.id,
    type: n.config.type as BuilderNodeType,
    label: labelFor(n.config.type as BuilderNodeType),
    x: 20 + i * 220,
    y: 80,
  }))

  // Rehydrate edges from successor lists
  for (const n of props.config.nodes) {
    for (const s of n.successors) {
      edges.value.push({ from: n.id, to: s })
    }
  }
})

// ── Canvas event handlers ──────────────────────────────────────────────────
function onDrop(type: BuilderNodeType, x: number, y: number) {
  nodes.value.push({ id: makeId(type), type, label: labelFor(type), x, y })
  syncDraftNodes()
}

function onReposition(id: string, x: number, y: number) {
  const node = nodes.value.find(n => n.id === id)
  if (node) { node.x = x; node.y = y }
}

function onRemove(id: string) {
  if (activeNodeId.value === id) activeNodeId.value = null
  nodes.value = nodes.value.filter(n => n.id !== id)
  edges.value = edges.value.filter(e => e.from !== id && e.to !== id)
  syncDraftNodes()
}

function onConnect(from: string, to: string) {
  if (!edges.value.some(e => e.from === from && e.to === to)) {
    edges.value.push({ from, to })
    syncDraftNodes()
  }
}

function onDisconnect(from: string, to: string) {
  edges.value = edges.value.filter(e => !(e.from === from && e.to === to))
  syncDraftNodes()
}

function onNodeClick(id: string) {
  showClientConfig.value = false
  activeNodeId.value = id
}

function closePopup() {
  activeNodeId.value = null
  showClientConfig.value = false
}

// Keep draftConfig.nodes in sync. Successor lists come from the edges array.
function syncDraftNodes() {
  const defaultCfg = createDefaultConfig()
  const processorDefaults = defaultCfg.nodes.filter(n => n.config.type === 'processor')
  const queueDefaults = defaultCfg.nodes.filter(n => n.config.type === 'queue')

  const existingProcessors = draftConfig.nodes.filter(n => n.config.type === 'processor')
  const existingQueues = draftConfig.nodes.filter(n => n.config.type === 'queue')

  let pIdx = 0, qIdx = 0
  const newNodes: PipelineNode[] = nodes.value.map(bn => {
    const successors = edges.value.filter(e => e.from === bn.id).map(e => e.to)

    if (bn.type === 'gateway') {
      return { id: bn.id, config: { type: 'gateway' }, successors }
    }
    if (bn.type === 'processor') {
      const existing = existingProcessors[pIdx]
      const fallback = processorDefaults[pIdx] ?? processorDefaults[0]
      const config = existing?.config ?? { ...(fallback.config as object), name: 'Processor' }
      pIdx++
      return { id: bn.id, config, successors }
    }
    // queue
    const existing = existingQueues[qIdx]
    const fallback = queueDefaults[qIdx] ?? queueDefaults[0]
    const config = existing?.config ?? fallback.config
    qIdx++
    return { id: bn.id, config, successors }
  })
  draftConfig.nodes = newNodes
}

// ── Popup routing ──────────────────────────────────────────────────────────
const activeNode = computed<PipelineNode | null>(() => {
  if (!activeNodeId.value) return null
  return draftConfig.nodes.find(n => n.id === activeNodeId.value) ?? null
})

function processorTitle(): string {
  const node = activeNode.value
  if (node?.config.type === 'processor' && node.config.name) return node.config.name
  return 'Processor'
}

function queueTitle(): string {
  if (!activeNodeId.value) return 'Queue'
  const idx = nodes.value.findIndex(n => n.id === activeNodeId.value)
  const ordinal = nodes.value.slice(0, idx).filter(n => n.type === 'queue').length
  return `Queue Q${ordinal + 1}`
}

// ── Validation & Apply ─────────────────────────────────────────────────────
function validate(): string[] {
  const errors: string[] = []
  const gateways = nodes.value.filter(n => n.type === 'gateway')
  if (gateways.length === 0) errors.push('Pipeline must include an API Gateway.')
  if (gateways.length > 1) errors.push('Pipeline can have at most one API Gateway.')
  if (errors.length > 0) return errors

  const gwId = gateways[0].id
  if (edges.value.some(e => e.to === gwId)) errors.push('API Gateway cannot have incoming connections.')

  try {
    toposort(draftConfig.nodes)
  } catch (e) {
    errors.push((e as Error).message)
  }
  return errors
}

function applyPipeline() {
  syncDraftNodes()
  const errors = validate()
  if (errors.length > 0) {
    validationErrors.value = errors
    return
  }
  validationErrors.value = []
  emit('apply', JSON.parse(JSON.stringify(draftConfig)))
}
</script>

<template>
  <div class="builder-tab">
    <ToolboxPanel />

    <div class="canvas-area">
      <div class="canvas-header">
        <div>
          <h2>Pipeline Builder</h2>
          <p class="hint">Drag to place. Pull from the <span class="port-hint">●</span> port to connect nodes.</p>
        </div>
        <div class="header-actions">
          <button class="clients-btn" @click="showClientConfig = true; activeNodeId = null">
            Clients ({{ draftConfig.clients.length }})
          </button>
          <button class="apply-btn" @click="applyPipeline">Apply Pipeline</button>
        </div>
      </div>

      <BuilderCanvas
        :nodes="nodes"
        :edges="edges"
        :draft-config="draftConfig"
        @drop="onDrop"
        @reposition="onReposition"
        @remove="onRemove"
        @connect="onConnect"
        @disconnect="onDisconnect"
        @node-click="onNodeClick"
      />

      <div v-if="validationErrors.length > 0" class="validation-errors">
        <div v-for="err in validationErrors" :key="err" class="error-item">{{ err }}</div>
      </div>
    </div>

    <!-- Popups -->
    <GatewayConfig
      v-if="activeNode?.config.type === 'gateway'"
      :config="draftConfig"
      @close="closePopup"
    />
    <ProcessorConfig
      v-if="activeNode?.config.type === 'processor'"
      :node="activeNode"
      :title="processorTitle()"
      @close="closePopup"
    />
    <QueueConfig
      v-if="activeNode?.config.type === 'queue'"
      :title="queueTitle()"
      :node="activeNode"
      @close="closePopup"
    />
    <ClientConfig
      v-if="showClientConfig"
      :config="draftConfig"
      @close="closePopup"
    />
  </div>
</template>

<style scoped>
.builder-tab {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.canvas-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.canvas-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
}

.port-hint {
  display: inline-block;
  font-size: 8px;
  vertical-align: middle;
  color: var(--primary);
  opacity: 0.8;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.apply-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.apply-btn:hover {
  background: var(--primary-hover);
}

.clients-btn {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
}

.clients-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.validation-errors {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-item {
  font-size: 13px;
  color: var(--danger);
  padding: 8px 12px;
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  border-radius: 6px;
  border-left: 3px solid var(--danger);
}
</style>

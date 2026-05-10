<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { BuilderNode, BuilderEdge, BuilderNodeType } from '@/types/builder'
import type { DAGPipelineConfig } from '@/types/config'
import ComponentBox from '../diagram/ComponentBox.vue'

const props = defineProps<{
  nodes: BuilderNode[]
  edges: BuilderEdge[]
  draftConfig: DAGPipelineConfig
}>()

const emit = defineEmits<{
  drop: [type: BuilderNodeType, x: number, y: number]
  reposition: [id: string, x: number, y: number]
  remove: [id: string]
  connect: [from: string, to: string]
  disconnect: [from: string, to: string]
  nodeClick: [id: string]
}>()

const canvasRef = ref<HTMLElement>()
// reactive Map so computed edge paths update when elements are registered
const nodeEls = reactive(new Map<string, HTMLElement>())

const COLOR: Record<BuilderNodeType, string> = {
  gateway:   '#ef4444',
  processor: '#f59e0b',
  queue:     '#22c55e',
}

function setNodeEl(el: unknown, id: string) {
  if (el) nodeEls.set(id, el as HTMLElement)
  else nodeEls.delete(id)
}

function getSize(id: string): { w: number; h: number } {
  const el = nodeEls.get(id)
  return { w: el?.offsetWidth ?? 160, h: el?.offsetHeight ?? 64 }
}

// Canvas grows to fit all nodes
const canvasW = computed(() => {
  let max = 600
  for (const n of props.nodes) max = Math.max(max, n.x + 240)
  return max
})
const canvasH = computed(() => {
  let max = 300
  for (const n of props.nodes) max = Math.max(max, n.y + 140)
  return max
})

// ── Labels ──────────────────────────────────────────────────────────────────
function processorLabel(node: BuilderNode): string {
  const ordinal = props.nodes.filter(n => n.type === 'processor').indexOf(node)
  const pNodes = props.draftConfig.nodes.filter(n => n.config.type === 'processor')
  const pNode = pNodes[ordinal]
  if (pNode?.config.type === 'processor' && pNode.config.name) return pNode.config.name
  return 'Processor'
}

function nodeSubtitle(node: BuilderNode): string {
  const cfg = props.draftConfig
  if (node.type === 'gateway') return `${cfg.tiers.length} tiers / ${cfg.clients.length} clients`
  if (node.type === 'processor') {
    const ordinal = props.nodes.filter(n => n.type === 'processor').indexOf(node)
    const pNode = cfg.nodes.filter(n => n.config.type === 'processor')[ordinal]
    if (!pNode || pNode.config.type !== 'processor') return ''
    return pNode.config.throughputPerSecond !== undefined
      ? `${pNode.config.processingLatencyMs}ms · ${pNode.config.throughputPerSecond} rps`
      : `${pNode.config.processingLatencyMs}ms`
  }
  if (node.type === 'queue') {
    const ordinal = props.nodes.filter(n => n.type === 'queue').indexOf(node)
    const qNode = cfg.nodes.filter(n => n.config.type === 'queue')[ordinal]
    if (!qNode || qNode.config.type !== 'queue') return ''
    return `depth: ${qNode.config.maxDepth}`
  }
  return ''
}

// ── Node drag (reposition) ────────────────────────────────────────────────
function onNodeMousedown(e: MouseEvent, node: BuilderNode) {
  if ((e.target as Element).closest('.port-out, .remove-btn')) return
  e.preventDefault()

  const origX = node.x
  const origY = node.y
  const startMX = e.clientX
  const startMY = e.clientY
  let moved = false

  const onMove = (mv: MouseEvent) => {
    const dx = mv.clientX - startMX
    const dy = mv.clientY - startMY
    if (!moved && Math.hypot(dx, dy) > 4) moved = true
    if (moved) emit('reposition', node.id, Math.max(0, origX + dx), Math.max(0, origY + dy))
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    if (!moved) emit('nodeClick', node.id)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ── Port drag (edge creation) ─────────────────────────────────────────────
interface PendingEdge { fromId: string; x1: number; y1: number; x2: number; y2: number }
const pendingEdge = ref<PendingEdge | null>(null)

function onPortMousedown(e: MouseEvent, fromId: string) {
  e.stopPropagation()
  e.preventDefault()

  const { w, h } = getSize(fromId)
  const srcNode = props.nodes.find(n => n.id === fromId)!
  const x1 = srcNode.x + w
  const y1 = srcNode.y + h / 2

  // get canvas rect now; re-read on move in case of scroll
  const getRect = () => canvasRef.value!.getBoundingClientRect()

  pendingEdge.value = { fromId, x1, y1, x2: x1, y2: y1 }

  const onMove = (mv: MouseEvent) => {
    const rect = getRect()
    pendingEdge.value = { fromId, x1, y1, x2: mv.clientX - rect.left, y2: mv.clientY - rect.top }
  }

  const onUp = (up: MouseEvent) => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    pendingEdge.value = null
    const els = document.elementsFromPoint(up.clientX, up.clientY)
    for (const el of els) {
      const wrapper = (el as Element).closest<HTMLElement>('[data-node-id]')
      if (wrapper) {
        const toId = wrapper.dataset.nodeId!
        if (toId !== fromId) emit('connect', fromId, toId)
        break
      }
    }
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ── Edge SVG paths ─────────────────────────────────────────────────────────
function edgePath(fromId: string, toId: string): string {
  const src = props.nodes.find(n => n.id === fromId)
  const dst = props.nodes.find(n => n.id === toId)
  if (!src || !dst) return ''
  const { w: sw, h: sh } = getSize(fromId)
  const { h: dh } = getSize(toId)
  const x1 = src.x + sw, y1 = src.y + sh / 2
  const x2 = dst.x,      y2 = dst.y + dh / 2
  const cx = Math.max(60, Math.abs(x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + cx} ${y1} ${x2 - cx} ${y2} ${x2} ${y2}`
}

function pendingPath(p: PendingEdge): string {
  const cx = Math.max(40, Math.abs(p.x2 - p.x1) / 2)
  return `M ${p.x1} ${p.y1} C ${p.x1 + cx} ${p.y1} ${p.x2 - cx} ${p.y2} ${p.x2} ${p.y2}`
}

// ── HTML DnD (toolbox → canvas) ───────────────────────────────────────────
const dragOverCanvas = ref(false)

function onCanvasDragOver(e: DragEvent) {
  if (e.dataTransfer!.types.includes('application/x-builder-index')) return
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'copy'
  dragOverCanvas.value = true
}

function onCanvasDrop(e: DragEvent) {
  e.preventDefault()
  dragOverCanvas.value = false
  if (e.dataTransfer!.types.includes('application/x-builder-index')) return
  const type = e.dataTransfer!.getData('text/plain') as BuilderNodeType
  if (!['gateway', 'processor', 'queue'].includes(type)) return
  const rect = canvasRef.value!.getBoundingClientRect()
  emit('drop', type, Math.max(0, e.clientX - rect.left - 70), Math.max(0, e.clientY - rect.top - 32))
}

function onCanvasDragLeave(e: DragEvent) {
  if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) {
    dragOverCanvas.value = false
  }
}
</script>

<template>
  <div
    class="canvas-scroll"
    :class="{ 'drag-over': dragOverCanvas }"
    @dragover="onCanvasDragOver"
    @drop="onCanvasDrop"
    @dragleave="onCanvasDragLeave"
  >
    <div
      ref="canvasRef"
      class="canvas-inner"
      :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
    >
      <div v-if="nodes.length === 0" class="empty-state">
        Drag components from the panel to build your pipeline.
      </div>

      <!-- SVG edge layer (on top, but pointer-events: none except on edge paths) -->
      <svg
        class="edge-layer"
        :width="canvasW"
        :height="canvasH"
        style="pointer-events: none"
      >
        <defs>
          <marker id="dag-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="var(--text-muted)" />
          </marker>
          <marker id="dag-arrow-pending" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="var(--primary)" opacity="0.6" />
          </marker>
        </defs>

        <g v-for="edge in edges" :key="`${edge.from}-${edge.to}`">
          <!-- Wide transparent hit area for clicking -->
          <path
            :d="edgePath(edge.from, edge.to)"
            fill="none"
            stroke="transparent"
            stroke-width="14"
            style="pointer-events: stroke; cursor: pointer"
            @click="emit('disconnect', edge.from, edge.to)"
          />
          <!-- Visible edge -->
          <path
            :d="edgePath(edge.from, edge.to)"
            fill="none"
            stroke="var(--text-muted)"
            stroke-width="2"
            marker-end="url(#dag-arrow)"
          />
        </g>

        <!-- Preview while dragging from a port -->
        <path
          v-if="pendingEdge"
          :d="pendingPath(pendingEdge)"
          fill="none"
          stroke="var(--primary)"
          stroke-width="2"
          stroke-dasharray="6 3"
          marker-end="url(#dag-arrow-pending)"
          opacity="0.7"
        />
      </svg>

      <!-- Nodes -->
      <div
        v-for="node in nodes"
        :key="node.id"
        class="node-wrapper"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
        :data-node-id="node.id"
        :ref="(el) => setNodeEl(el, node.id)"
        @mousedown="onNodeMousedown($event, node)"
      >
        <ComponentBox
          :label="node.type === 'processor' ? processorLabel(node) : node.label"
          :subtitle="nodeSubtitle(node)"
          :color="COLOR[node.type]"
          :compact="node.type === 'queue'"
        />
        <div
          class="port-out"
          title="Drag to connect"
          @mousedown="onPortMousedown($event, node.id)"
        />
        <button
          class="remove-btn"
          :title="`Remove ${node.label}`"
          @click.stop="emit('remove', node.id)"
        >&times;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-scroll {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: auto;
  transition: border-color 0.15s;
  min-height: 300px;
}

.canvas-scroll.drag-over {
  border-color: var(--primary);
}

.canvas-inner {
  position: relative;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-muted);
  font-size: 13px;
  pointer-events: none;
  white-space: nowrap;
}

.edge-layer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.node-wrapper {
  position: absolute;
  cursor: grab;
  user-select: none;
  z-index: 1;
}

.node-wrapper:active {
  cursor: grabbing;
}

.port-out {
  position: absolute;
  right: -7px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 2px solid var(--border);
  cursor: crosshair;
  z-index: 3;
  transition: background 0.12s, border-color 0.12s;
}

.port-out:hover {
  background: var(--primary);
  border-color: var(--primary);
}

.remove-btn {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--danger);
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0;
  transition: opacity 0.12s;
  z-index: 3;
  cursor: pointer;
}

.node-wrapper:hover .remove-btn {
  opacity: 1;
}
</style>

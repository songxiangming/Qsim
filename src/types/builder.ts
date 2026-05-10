export type BuilderNodeType = 'gateway' | 'processor' | 'queue'

export interface BuilderNode {
  id: string
  type: BuilderNodeType
  label: string
  x: number
  y: number
}

export interface BuilderEdge {
  from: string
  to: string
}

export interface ToolboxItem {
  type: BuilderNodeType
  label: string
  color: string
}

export const TOOLBOX_ITEMS: ToolboxItem[] = [
  { type: 'gateway',   label: 'API Gateway', color: '#ef4444' },
  { type: 'processor', label: 'Processor',   color: '#f59e0b' },
  { type: 'queue',     label: 'Queue',       color: '#22c55e' },
]

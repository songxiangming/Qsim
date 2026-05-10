import type { PipelineNode } from '@/types/config'

/** Kahn's algorithm. Returns node IDs in source-first (topological) order. Throws on cycle. */
export function toposort(nodes: PipelineNode[]): string[] {
  const idSet = new Set(nodes.map((n) => n.id))
  const inDegree = new Map<string, number>()
  for (const node of nodes) inDegree.set(node.id, 0)
  for (const node of nodes) {
    for (const s of node.successors) {
      if (!idSet.has(s)) throw new Error(`Unknown successor node: ${s}`)
      inDegree.set(s, (inDegree.get(s) ?? 0) + 1)
    }
  }

  const queue: string[] = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id)
  }

  const order: string[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)
    const node = nodes.find((n) => n.id === id)!
    for (const s of node.successors) {
      const deg = inDegree.get(s)! - 1
      inDegree.set(s, deg)
      if (deg === 0) queue.push(s)
    }
  }

  if (order.length !== nodes.length) throw new Error('Pipeline contains a cycle')
  return order
}

import { ref, onUnmounted } from 'vue'
import type { DAGPipelineConfig } from '@/types/config'
import type { TickMetrics, ClientResults } from '@/types/simulation'
import type { WorkerToMainMessage } from '@/types/worker-protocol'

export function useSimulation() {
  const metrics = ref<TickMetrics | null>(null)
  const results = ref<ClientResults[] | null>(null)
  const running = ref(false)
  const paused = ref(false)
  let worker: Worker | null = null

  function start(config: DAGPipelineConfig) {
    stop()
    results.value = null
    metrics.value = null
    running.value = true
    paused.value = false

    worker = new Worker(new URL('@/engine/worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<WorkerToMainMessage>) => {
      switch (e.data.type) {
        case 'TICK':
          metrics.value = e.data.metrics
          break
        case 'COMPLETE':
          results.value = e.data.results
          running.value = false
          paused.value = false
          break
        case 'ERROR':
          console.error('Simulation error:', e.data.message)
          running.value = false
          paused.value = false
          break
      }
    }
    worker.postMessage({ type: 'START', config: JSON.parse(JSON.stringify(config)) })
  }

  function pause() {
    if (worker && running.value) {
      worker.postMessage({ type: 'PAUSE' })
      paused.value = true
    }
  }

  function resume() {
    if (worker && running.value) {
      worker.postMessage({ type: 'RESUME' })
      paused.value = false
    }
  }

  function stop() {
    if (worker) {
      worker.postMessage({ type: 'STOP' })
      setTimeout(() => {
        worker?.terminate()
        worker = null
      }, 200)
    }
    running.value = false
    paused.value = false
    metrics.value = null
  }

  onUnmounted(stop)

  return { metrics, results, running, paused, start, stop, pause, resume }
}

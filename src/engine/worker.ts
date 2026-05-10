import type { MainToWorkerMessage, WorkerToMainMessage } from '@/types/worker-protocol'
import { runSimulation } from './simulation-loop'


let stopped = false
let paused = false

self.onmessage = (e: MessageEvent<MainToWorkerMessage>) => {
  switch (e.data.type) {
    case 'START':
      stopped = false
      paused = false
      runSimulation(
        e.data.config,
        (metrics) => post({ type: 'TICK', metrics }),
        (results) => post({ type: 'COMPLETE', results }),
        () => stopped,
        () => paused,
      )
      break
    case 'STOP':
      stopped = true
      break
    case 'PAUSE':
      paused = true
      break
    case 'RESUME':
      paused = false
      break
  }
}

function post(msg: WorkerToMainMessage) {
  self.postMessage(msg)
}

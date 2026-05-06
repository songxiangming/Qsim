import type { MainToWorkerMessage, WorkerToMainMessage } from '@/types/worker-protocol'
import { runSimulation } from './simulation-loop'

let stopped = false

self.onmessage = (e: MessageEvent<MainToWorkerMessage>) => {
  switch (e.data.type) {
    case 'START':
      stopped = false
      runSimulation(
        e.data.config,
        (metrics) => post({ type: 'TICK', metrics }),
        (results) => post({ type: 'COMPLETE', results }),
        () => stopped,
      )
      break
    case 'STOP':
      stopped = true
      break
  }
}

function post(msg: WorkerToMainMessage) {
  self.postMessage(msg)
}

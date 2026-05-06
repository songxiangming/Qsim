import type { SimulationConfig } from './config'
import type { TickMetrics, ClientResults } from './simulation'

export type MainToWorkerMessage =
  | { type: 'START'; config: SimulationConfig }
  | { type: 'STOP' }

export type WorkerToMainMessage =
  | { type: 'TICK'; metrics: TickMetrics }
  | { type: 'COMPLETE'; results: ClientResults[] }
  | { type: 'ERROR'; message: string }

import type { DAGPipelineConfig } from './config'
import type { TickMetrics, ClientResults } from './simulation'

export type MainToWorkerMessage =
  | { type: 'START'; config: DAGPipelineConfig }
  | { type: 'STOP' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }

export type WorkerToMainMessage =
  | { type: 'TICK'; metrics: TickMetrics }
  | { type: 'COMPLETE'; results: ClientResults[] }
  | { type: 'ERROR'; message: string }

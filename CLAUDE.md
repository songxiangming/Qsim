# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Type-check (vue-tsc) then production build
- `npx vue-tsc -b --noEmit` — Type-check only

## Architecture

QSim is a browser-based payment pipeline simulator. Vue 3 UI spawns a **WebWorker** that runs the simulation engine in a tight loop, posting metrics back to the main thread.

### Pipeline

```
Clients → API Gateway → Preprocessor → Q1 → Async Processor → Q2 → BOS
```

- **API Gateway** (`engine/components/api-gateway.ts`): Fixed-window rate limiting, dual windows (average + peak) per client, limits defined by tier
- **Preprocessor / Async Processor**: Unlimited throughput, configurable latency; messages sit in an `inFlight` array until completion time
- **Q1 / Q2** (`engine/components/queue.ts`): Bounded FIFO; enqueue returns false when full (backpressure rejection)
- **BOS** (`engine/components/bos.ts`): Token-bucket throughput limiter + processing latency

### Simulation Loop (`engine/simulation-loop.ts`)

Ticks are processed in **reverse pipeline order** (BOS first, then Q2, then async processor, etc.) to prevent messages from traversing the entire pipeline in a single tick. The loop batches 50 ticks per `processBatch()` call, then yields via `setTimeout(config.batchSleepMs)`. Tick metrics are posted to the main thread at ~60fps (16ms wall-clock throttle).

### Worker Protocol (`types/worker-protocol.ts`)

Main→Worker: `START` (with serialized config), `STOP`. Worker→Main: `TICK` (real-time metrics), `COMPLETE` (per-client results), `ERROR`.

### UI Structure

Two tabs: **Config** (click pipeline boxes to open config popups) and **Simulation** (start/stop, live metrics in diagram, results table after completion). The `useSimulation` composable (`ui/composables/useSimulation.ts`) manages worker lifecycle and exposes reactive `metrics` and `results` refs.

### Workload Generation (`engine/client-workload.ts`)

Two patterns: `stable` (constant RPS) and `burst` (base RPS with periodic burst windows). Uses fractional accumulation to handle sub-1 requests per tick correctly.

### Latency Metric

Client-perceived latency is **HGP response time**: `preprocessorDoneMs - createdAtMs`. The async pipeline (Q1→BOS) is invisible to the client.

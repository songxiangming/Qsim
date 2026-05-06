# QSim — Banking Payment Queue Simulator

Browser-based simulation of an APS payment processing pipeline.

```
Clients → API Gateway → Preprocessor → Q1 → Async Processor → Q2 → BOS
```

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Production Build

```bash
npm run build
npm run preview   # serves dist/ at http://localhost:4173
```

## Usage

**Config tab** — click any component in the pipeline diagram to configure it. Set up client tiers (rate limits), individual clients (workload patterns), queue depths, processor latencies, and BOS throughput.

**Simulation tab** — set time step, duration, and batch sleep, then hit Start. Watch real-time metrics in the diagram (rejected requests, queue fill levels, in-flight counts). Pause/resume or stop at any time. After completion, a results table shows per-client stats: sent, successful, rejected, p95 HGP latency, and p95 end-to-end latency.

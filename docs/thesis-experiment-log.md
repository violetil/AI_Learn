# Thesis Experiment Log

- Generated at: 2026-05-03T02:47:28.717Z
- Model: deepseek-v4-flash
- Base URL: https://api.deepseek.com
- Mode: live

## 1) Pipeline Latency

- Non-streaming: runs=12, success=12, avg=6723.55ms, p95=8940.77ms
- Streaming total: runs=12, success=12, avg=6696.44ms, p95=9971.07ms
- Streaming first-token: avg=2734.77ms, p95=5057.47ms

## 2) RAG Ablation (Keyword-based rubric)

- Sample size: 6
- Without RAG: precision=0.4667, recall=0.5833, f1=0.5185, avgLatency=20604.66ms
- With RAG: precision=0.6667, recall=1, f1=0.8, avgLatency=7706.27ms

## 3) Availability

- Total requests: 36
- Success requests: 36
- Availability score: 1

## Notes

- This benchmark is generated from project code paths (`lib/ai.ts`) and synthetic course prompts.
- Raw machine-readable results are stored in `docs/thesis-metrics.json`.
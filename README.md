# health-metrics-dashboard

Next.js 14 frontend for [growthink1/health-metrics-service](https://github.com/growthink1/health-metrics-service).

## Dev

1. Run the backend: `cd ~/code/health-metrics-service && source .venv/bin/activate && uvicorn src.health_metrics.main:app --port 8000`
2. Run the dashboard: `npm run dev` (port 3000)
3. Open http://localhost:3000

`.env.local` needs `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.

## Tests

- `npm run test` — Vitest (API client)
- `npm run e2e` — Playwright smoke (needs dev server + backend running)

## Deploy

Deployed on Railway alongside the backend. Backend URL goes into the dashboard's `NEXT_PUBLIC_API_BASE_URL` env var.

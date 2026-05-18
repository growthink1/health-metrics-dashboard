# health-metrics-dashboard

Next.js 16 frontend for [growthink1/health-metrics-service](https://github.com/growthink1/health-metrics-service).

## Dev

```bash
# Backend (env_ignore_empty fix means no env -u needed):
cd ~/code/health-metrics-service && source .venv/bin/activate && uvicorn src.health_metrics.main:app --port 8000

# Dashboard:
cd ~/code/health-metrics-dashboard && npm run dev
```

Open http://localhost:3000.

`.env.local` needs `API_BASE_URL_INTERNAL=http://localhost:8000` (used by SSR; the catchall proxy at `app/api/[...path]/route.ts` forwards browser calls there too). `DASHBOARD_PASSWORD` is unset locally so Basic Auth is bypassed in dev.

## Tests

- `npm run test` — Vitest (API client, 5 tests)
- `npm run e2e` — Playwright smoke (3 tests; needs dev server + backend running)
- `npm run build` — TypeScript strict + ESLint clean

## Architecture

- **`app/page.tsx`** + drill-down pages render server-side; SSR fetches the backend directly via `API_BASE_URL_INTERNAL` (Railway internal IPv6 network in prod, localhost in dev).
- **Browser-side fetches** (currently just `postManualLog` from `LogPanel`) go same-origin to `/api/<path>` which the catchall proxy (`app/api/[...path]/route.ts`) forwards to the backend internal URL server-side. Means no cross-origin CORS, no public backend domain needed.
- **`middleware.ts`** — HTTP Basic Auth gate on every dashboard route (except Next.js static assets). Reads `DASHBOARD_USERNAME` (default `hugo`) and `DASHBOARD_PASSWORD` from env. Unset password = bypass (dev mode).

## Deploy

Live at **https://health.ironforgeai.com** behind HTTP Basic Auth (single-user). Auto-deployed from `main` to Railway service `dashboard` in the `health-metrics` project. Backend lives in the same Railway project as `backend` — talks via Railway's internal network.

Env vars set on the Railway service:
- `DASHBOARD_USERNAME` (= `hugo`)
- `DASHBOARD_PASSWORD` (32-char random; stored in 1Password)
- `API_BASE_URL_INTERNAL` (= `http://backend.railway.internal:8080`)

Deploy spec: [`growthink1/health-metrics-service` → `docs/superpowers/specs/2026-05-18-railway-deploy-design.md`](https://github.com/growthink1/health-metrics-service/blob/main/docs/superpowers/specs/2026-05-18-railway-deploy-design.md).

import type {
  DashboardTodayResponse,
  DashboardGridResponse,
  MetricDetailResponse,
  ManualLogPayload,
  ManualLogResponse,
  WorkoutsResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function _get<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!resp.ok) {
    throw new Error(`API ${path} failed: ${resp.status} ${resp.statusText}`);
  }
  return resp.json() as Promise<T>;
}

export async function fetchDashboardToday(userId = "hugo", asOf?: string) {
  const qs = new URLSearchParams({ user_id: userId, ...(asOf ? { as_of: asOf } : {}) });
  return _get<DashboardTodayResponse>(`/api/dashboard/today?${qs}`);
}

export async function fetchDashboardGrid(userId = "hugo", days = 14, asOf?: string) {
  const qs = new URLSearchParams({
    user_id: userId,
    days: String(days),
    ...(asOf ? { as_of: asOf } : {}),
  });
  return _get<DashboardGridResponse>(`/api/dashboard/grid?${qs}`);
}

export async function fetchMetricDetail(name: string, userId = "hugo", days = 14, asOf?: string) {
  const qs = new URLSearchParams({
    user_id: userId,
    days: String(days),
    ...(asOf ? { as_of: asOf } : {}),
  });
  return _get<MetricDetailResponse>(`/api/metric/${encodeURIComponent(name)}?${qs}`);
}

export async function fetchWorkouts(
  userId = "hugo",
  days = 30,
  workoutType?: string,
  asOf?: string,
) {
  const qs = new URLSearchParams({
    user_id: userId,
    days: String(days),
    ...(workoutType ? { workout_type: workoutType } : {}),
    ...(asOf ? { as_of: asOf } : {}),
  });
  return _get<WorkoutsResponse>(`/api/workouts?${qs}`);
}

export async function postManualLog(payload: ManualLogPayload): Promise<ManualLogResponse> {
  const resp = await fetch(`${API_BASE}/api/manual-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error(`POST /api/manual-log failed: ${resp.status} ${resp.statusText}`);
  }
  return resp.json() as Promise<ManualLogResponse>;
}

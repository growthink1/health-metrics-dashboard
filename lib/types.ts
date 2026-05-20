export type Recommendation = "deficit" | "deficit_conservative" | "maintenance" | "deload";

export interface TodayStripData {
  recommendation: Recommendation;
  suggested_kcal: number | null;
  suggested_training_mod: string | null;
  today_hrv_ms: number | null;
  hrv_z_3d_avg: number;
  log_status: string; // "complete" | "all_missing" | comma-separated *_missing tokens
}

export interface DashboardTodayResponse {
  as_of: string;
  metric_date: string;
  today_strip: TodayStripData;
  narration: string | null;
  narration_generated_at: string | null;
  rationale: string[];
}

export interface SeriesPoint {
  date: string;
  value: number | null;
  z?: number | null;
}

export interface GridTile {
  metric: "hrv" | "rhr" | "sleep_min" | "strain" | "recovery" | "weight_lbs";
  current: number | null;
  series: SeriesPoint[];
}

export interface DashboardGridResponse {
  n_days: number;
  tiles: GridTile[];
}

export interface MetricDetailResponse {
  metric: string;
  n_days: number;
  series: SeriesPoint[];
  stats: { mean: number; std: number; slope_per_day: number; z_today: number | null };
  baseline: { mean: number; lower_1sd: number; upper_1sd: number };
}

export interface ManualLogPayload {
  user_id?: string;
  date: string; // ISO yyyy-mm-dd
  subjective_energy?: number;
  subjective_mood?: number;
  subjective_hunger?: number;
  weight_lbs?: number;
  kcal_consumed?: number;
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  notes?: string;
}

export interface ManualLogResponse {
  logged_date: string;
  fields_updated: string[];
  completeness: { subjective: boolean; weight: boolean; nutrition: boolean };
  next_required_inputs: string[];
}

export interface Workout {
  id: number;
  date: string;
  source: string;
  source_id: string;
  type: string | null;
  started_at: string;
  duration_min: number;
  strain: number | null;
  kcal: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  zones: Record<string, number | null>;
}

export interface WorkoutsResponse {
  n_days: number;
  workouts: Workout[];
}

export interface Meal {
  id: number;
  date: string;
  time: string | null;
  meal_name: string | null;
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  notes: string | null;
  photo_path: string | null;
  source: string;
  created_at: string | null;
}

export interface MealsResponse {
  date: string;
  meals: Meal[];
}

export interface WorkoutSet {
  id: number;
  workout_id: number;
  set_number: number;
  exercise: string;
  reps: number;
  weight_lbs: number | null;
  rpe: number | null;
  notes: string | null;
  created_at: string | null;
}

export interface WorkoutSetsResponse {
  workout_id: number;
  sets: WorkoutSet[];
}

export interface ManualWorkoutPayload {
  user_id?: string;
  date: string;
  sport_name: string;
  duration_min: number;
  strain?: number;
  kcal?: number;
  notes?: string;
}

export interface ImageAttachment {
  type: "image";
  mediaType: string;
  data: string;
}

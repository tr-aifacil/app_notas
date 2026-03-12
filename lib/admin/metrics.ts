export type EpisodeMetricRow = {
  episode_id: string;
  patient_id: string;
  title: string;
  analytics_label: string | null;
  analytics_included: boolean;
  case_type: string | null;
  body_region: string | null;
  condition_type: string | null;
  condition_chronicity: string | null;
  profession: string;
  area: string;
  status: "ativo" | "alta" | "administrativo";
  outcome_status: "ongoing" | "recovered" | "dropout" | "referred_out" | "administrative_close" | "unknown";
  start_date: string;
  end_date: string | null;
  outcome_date: string | null;
  recovery_days: number | null;
  session_count: number;
  alerts_count: number;
};

export type DataQualityRow = {
  episode_id: string;
  severity: "ok" | "warning" | "critical";
  missing_title: boolean;
  missing_structured_classification: boolean;
  no_sessions: boolean;
  no_scales: boolean;
  closed_without_outcome: boolean;
  outcome_without_outcome_date: boolean;
  recovered_without_outcome_date: boolean;
  end_date_before_start_date: boolean;
  sparse_scale_data: boolean;
};

export type MetricsFilters = {
  dateFrom?: string;
  dateTo?: string;
  profession?: string;
  area?: string;
  clinicianId?: string;
  analyticsLabel?: string;
  outcomeStatus?: EpisodeMetricRow["outcome_status"];
  includeOpen?: boolean;
};

export function average(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v));
  if (!nums.length) return null;
  return Number((nums.reduce((acc, curr) => acc + curr, 0) / nums.length).toFixed(2));
}

export function median(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  const result = nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
  return Number(result.toFixed(2));
}

export function applyFilters(rows: EpisodeMetricRow[], filters: MetricsFilters) {
  return rows.filter((row) => {
    if (filters.dateFrom && row.start_date < filters.dateFrom) return false;
    if (filters.dateTo && row.start_date > filters.dateTo) return false;
    if (filters.profession && row.profession !== filters.profession) return false;
    if (filters.area && row.area !== filters.area) return false;
    if (filters.analyticsLabel && row.analytics_label !== filters.analyticsLabel) return false;
    if (filters.outcomeStatus && row.outcome_status !== filters.outcomeStatus) return false;
    if (!filters.includeOpen && row.outcome_status === "ongoing") return false;
    return true;
  });
}

export function qualityTopIssues(qualityRows: DataQualityRow[]) {
  const issues = new Map<string, number>();
  const keys: Array<keyof DataQualityRow> = [
    "missing_title",
    "missing_structured_classification",
    "no_sessions",
    "no_scales",
    "closed_without_outcome",
    "outcome_without_outcome_date",
    "recovered_without_outcome_date",
    "end_date_before_start_date",
    "sparse_scale_data",
  ];

  qualityRows.forEach((row) => {
    keys.forEach((key) => {
      if (row[key] === true) {
        issues.set(key, (issues.get(key) || 0) + 1);
      }
    });
  });

  return Array.from(issues.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

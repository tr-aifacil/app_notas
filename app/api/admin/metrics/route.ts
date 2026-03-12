import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminSupabase } from "@/lib/supabase/server";
import { applyFilters, average, median, qualityTopIssues, type DataQualityRow, type EpisodeMetricRow, type MetricsFilters } from "@/lib/admin/metrics";
import { Database } from "@/lib/db/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const search = req.nextUrl.searchParams;
    const page = Math.max(Number(search.get("page") || DEFAULT_PAGE), 1);
    const pageSize = Math.min(Math.max(Number(search.get("pageSize") || DEFAULT_PAGE_SIZE), 1), 100);

    const filters: MetricsFilters = {
      dateFrom: search.get("dateFrom") || undefined,
      dateTo: search.get("dateTo") || undefined,
      profession: search.get("profession") || undefined,
      area: search.get("area") || undefined,
      clinicianId: search.get("clinicianId") || undefined,
      analyticsLabel: search.get("analyticsLabel") || undefined,
      outcomeStatus: (search.get("outcomeStatus") as MetricsFilters["outcomeStatus"]) || undefined,
      includeOpen: (search.get("includeOpen") || "false") === "true",
    };

    const supabase = createAdminSupabase();
    const { data: allRowsData } = await supabase.from("admin_episode_metrics_v1").select("*");
    const { data: qualityRowsData } = await supabase.from("admin_data_quality_v1").select("*");
    const { data: cliniciansData } = await supabase.from("profile").select("id, display_name");

    const allRows = (allRowsData as EpisodeMetricRow[] | null) || [];
    const qualityRows = (qualityRowsData as DataQualityRow[] | null) || [];
    const clinicians: Array<Database["public"]["Tables"]["profile"]["Row"]> = (cliniciansData as Array<Database["public"]["Tables"]["profile"]["Row"]> | null) || [];
    const clinicianMap = new Map(clinicians.map((c) => [c.id, c.display_name]));

    let rows = applyFilters(allRows, filters);

    if (filters.clinicianId) {
      const { data: sessionEpisodesData } = await supabase
        .from("session")
        .select("episode_id")
        .eq("clinician_id", filters.clinicianId);
      const sessionEpisodes = (sessionEpisodesData as Array<{ episode_id: string }> | null) || [];
      const episodeIds = new Set(sessionEpisodes.map((s) => s.episode_id));
      rows = rows.filter((row) => episodeIds.has(row.episode_id));
    }

    const recoveryRowsBase = rows.filter((r) => r.analytics_included);
    const recoveredRows = recoveryRowsBase.filter((r) => r.outcome_status === "recovered" && r.recovery_days !== null);
    const closedRows = rows.filter((r) => r.outcome_status !== "ongoing");

    const byAnalyticsLabel = Array.from(
      rows.reduce((map, row) => {
        const key = row.analytics_label || "(sem classificação)";
        if (!map.has(key)) map.set(key, [] as typeof rows);
        map.get(key)?.push(row);
        return map;
      }, new Map<string, typeof rows>()).entries()
    )
      .map(([analyticsLabel, groupRows]) => {
        const recovered = groupRows.filter((r) => r.outcome_status === "recovered");
        return {
          analyticsLabel,
          count: groupRows.length,
          recoveredCount: recovered.length,
          averageRecoveryDays: average(recovered.map((r) => r.recovery_days)),
          medianRecoveryDays: median(recovered.map((r) => r.recovery_days)),
          averageSessionCount: average(groupRows.map((r) => r.session_count)),
        };
      })
      .sort((a, b) => b.count - a.count);

    const { data: sessionsData } = await supabase.from("session").select("episode_id, clinician_id");
    const sessions = (sessionsData as Array<{ episode_id: string; clinician_id: string | null }> | null) || [];
    const sessionByEpisode = sessions.reduce((map, session) => {
      if (!map.has(session.episode_id)) map.set(session.episode_id, new Set<string | null>());
      map.get(session.episode_id)?.add(session.clinician_id);
      return map;
    }, new Map<string, Set<string | null>>());

    const clinicianAgg = new Map<string | null, { episodeIds: Set<string>; recoveries: number[] }>();
    rows.forEach((row) => {
      const cliniciansForEpisode = sessionByEpisode.get(row.episode_id) || new Set<string | null>([null]);
      cliniciansForEpisode.forEach((clinicianId) => {
        if (!clinicianAgg.has(clinicianId)) clinicianAgg.set(clinicianId, { episodeIds: new Set(), recoveries: [] });
        const agg = clinicianAgg.get(clinicianId)!;
        agg.episodeIds.add(row.episode_id);
        if (row.outcome_status === "recovered" && row.recovery_days !== null) {
          agg.recoveries.push(row.recovery_days);
        }
      });
    });

    const byClinicianRows = Array.from(clinicianAgg.entries()).map(([clinicianId, agg]) => ({
      clinicianId,
      clinicianName: clinicianId ? clinicianMap.get(clinicianId) || null : null,
      episodeCount: agg.episodeIds.size,
      recoveredCount: agg.recoveries.length,
      averageRecoveryDays: average(agg.recoveries),
    })).sort((a, b) => b.episodeCount - a.episodeCount);

    const monthlyMap = new Map<string, { startedEpisodes: number; closedEpisodes: number; recoveredEpisodes: number }>();
    rows.forEach((row) => {
      const month = row.start_date.slice(0, 7);
      if (!monthlyMap.has(month)) monthlyMap.set(month, { startedEpisodes: 0, closedEpisodes: 0, recoveredEpisodes: 0 });
      const bucket = monthlyMap.get(month)!;
      bucket.startedEpisodes += 1;
      if (row.outcome_status !== "ongoing") bucket.closedEpisodes += 1;
      if (row.outcome_status === "recovered") bucket.recoveredEpisodes += 1;
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, values]) => ({ month, ...values }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const filteredQuality = qualityRows.filter((q) => rows.some((r) => r.episode_id === q.episode_id));
    const totalRows = rows.length;
    const start = (page - 1) * pageSize;
    const pagedRows = rows.slice(start, start + pageSize);

    return NextResponse.json({
      summary: {
        totalEpisodes: rows.length,
        activeEpisodes: rows.filter((r) => r.status === "ativo").length,
        closedEpisodes: closedRows.length,
        recoveredEpisodes: recoveredRows.length,
        medianRecoveryDays: median(recoveredRows.map((r) => r.recovery_days)),
        averageRecoveryDays: average(recoveredRows.map((r) => r.recovery_days)),
        averageSessionsPerRecoveredEpisode: average(recoveredRows.map((r) => r.session_count)),
      },
      byAnalyticsLabel,
      byClinician: byClinicianRows,
      monthlyTrend,
      dataQuality: {
        totalFlaggedEpisodes: filteredQuality.filter((q) => q.severity !== "ok").length,
        criticalCount: filteredQuality.filter((q) => q.severity === "critical").length,
        warningCount: filteredQuality.filter((q) => q.severity === "warning").length,
        topIssues: qualityTopIssues(filteredQuality),
      },
      rows: pagedRows.map((row) => ({
        episodeId: row.episode_id,
        patientId: row.patient_id,
        title: row.title,
        analyticsLabel: row.analytics_label,
        analyticsIncluded: row.analytics_included,
        caseType: row.case_type,
        profession: row.profession,
        area: row.area,
        status: row.status,
        outcomeStatus: row.outcome_status,
        startDate: row.start_date,
        outcomeDate: row.outcome_date,
        recoveryDays: row.recovery_days,
        sessionCount: row.session_count,
        alertsCount: row.alerts_count,
      })),
      pagination: {
        page,
        pageSize,
        totalRows,
      },
    });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

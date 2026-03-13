"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MetricsResponse = {
  summary: {
    totalEpisodes: number;
    activeEpisodes: number;
    closedEpisodes: number;
    recoveredEpisodes: number;
    medianRecoveryDays: number | null;
    averageRecoveryDays: number | null;
    averageSessionsPerRecoveredEpisode: number | null;
  };
  byAnalyticsLabel: Array<{
    analyticsLabel: string;
    count: number;
    recoveredCount: number;
    averageRecoveryDays: number | null;
    medianRecoveryDays: number | null;
    averageSessionCount: number | null;
  }>;
  byClinician: Array<{
    clinicianId: string | null;
    clinicianName: string | null;
    episodeCount: number;
    recoveredCount: number;
    averageRecoveryDays: number | null;
  }>;
  monthlyTrend: Array<{
    month: string;
    startedEpisodes: number;
    closedEpisodes: number;
    recoveredEpisodes: number;
  }>;
  dataQuality: {
    totalFlaggedEpisodes: number;
    criticalCount: number;
    warningCount: number;
    topIssues: Array<{ issue: string; count: number }>;
  };
  rows: Array<{
    episodeId: string;
    patientId: string;
    title: string;
    analyticsLabel: string | null;
    profession: string;
    area: string;
    status: string;
    outcomeStatus: string;
    startDate: string;
    outcomeDate: string | null;
    recoveryDays: number | null;
    sessionCount: number;
    alertsCount: number;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
  };
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    profession: "",
    area: "",
    clinicianId: "",
    analyticsLabel: "",
    outcomeStatus: "",
    includeOpen: true,
    page: 1,
    pageSize: 20,
  });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        params.set(key, String(value));
      } else if (value) {
        params.set(key, String(value));
      }
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/metrics?${query}`);
      const payload = await res.json();
      setData(payload);
      setLoading(false);
    };
    load();
  }, [query]);

  const setFilter = (key: string, value: string | boolean | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === "page" ? Number(value) : 1 }));
  };

  if (loading && !data) {
    return <p className="text-sm text-slate-600">A carregar métricas...</p>;
  }

  if (!data) {
    return <p className="text-sm text-red-600">Não foi possível carregar métricas.</p>;
  }

  return (
    <div className="space-y-4">
      <section className="card grid gap-3 md:grid-cols-4">
        <input className="input" type="date" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)} />
        <input className="input" type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)} />
        <input className="input" placeholder="Profissão" value={filters.profession} onChange={(e) => setFilter("profession", e.target.value)} />
        <input className="input" placeholder="Área" value={filters.area} onChange={(e) => setFilter("area", e.target.value)} />
        <input className="input" placeholder="Clinician ID" value={filters.clinicianId} onChange={(e) => setFilter("clinicianId", e.target.value)} />
        <input className="input" placeholder="Analytics label" value={filters.analyticsLabel} onChange={(e) => setFilter("analyticsLabel", e.target.value)} />
        <select className="input" value={filters.outcomeStatus} onChange={(e) => setFilter("outcomeStatus", e.target.value)}>
          <option value="">Todos os outcomes</option>
          <option value="ongoing">ongoing</option>
          <option value="recovered">recovered</option>
          <option value="dropout">dropout</option>
          <option value="referred_out">referred_out</option>
          <option value="administrative_close">administrative_close</option>
          <option value="unknown">unknown</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={filters.includeOpen} onChange={(e) => setFilter("includeOpen", e.target.checked)} />
          Incluir episódios abertos
        </label>
      </section>

      <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        <div className="card"><p>Total episódios</p><p className="text-2xl font-semibold">{data.summary.totalEpisodes}</p></div>
        <div className="card"><p>Ativos</p><p className="text-2xl font-semibold">{data.summary.activeEpisodes}</p></div>
        <div className="card"><p>Fechados</p><p className="text-2xl font-semibold">{data.summary.closedEpisodes}</p></div>
        <div className="card"><p>Recuperados</p><p className="text-2xl font-semibold">{data.summary.recoveredEpisodes}</p></div>
        <div className="card"><p>Média recovery (dias)</p><p className="text-2xl font-semibold">{data.summary.averageRecoveryDays ?? "-"}</p></div>
        <div className="card"><p>Mediana recovery (dias)</p><p className="text-2xl font-semibold">{data.summary.medianRecoveryDays ?? "-"}</p></div>
        <div className="card"><p>Média sessões / recuperado</p><p className="text-2xl font-semibold">{data.summary.averageSessionsPerRecoveredEpisode ?? "-"}</p></div>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Recovery por classificação analítica</h2>
        <table className="w-full text-sm">
          <thead><tr><th>Classificação</th><th>N</th><th>Recuperados</th><th>Média</th><th>Mediana</th></tr></thead>
          <tbody>
            {data.byAnalyticsLabel.map((row) => (
              <tr key={row.analyticsLabel}><td>{row.analyticsLabel}</td><td>{row.count}</td><td>{row.recoveredCount}</td><td>{row.averageRecoveryDays ?? "-"}</td><td>{row.medianRecoveryDays ?? "-"}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Recovery por Clínico</h2>
        <table className="w-full text-sm">
          <thead><tr><th>Clínico</th><th>Episódios</th><th>Recuperados</th><th>Média dias</th></tr></thead>
          <tbody>
            {data.byClinician.map((row) => (
              <tr key={row.clinicianId || "none"}><td>{row.clinicianName || row.clinicianId || "Sem clínico"}</td><td>{row.episodeCount}</td><td>{row.recoveredCount}</td><td>{row.averageRecoveryDays ?? "-"}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Tendência mensal</h2>
        <table className="w-full text-sm">
          <thead><tr><th>Mês</th><th>Iniciados</th><th>Fechados</th><th>Recuperados</th></tr></thead>
          <tbody>
            {data.monthlyTrend.map((row) => (
              <tr key={row.month}><td>{row.month}</td><td>{row.startedEpisodes}</td><td>{row.closedEpisodes}</td><td>{row.recoveredEpisodes}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Qualidade de dados</h2>
        <p className="text-sm">Flagged: {data.dataQuality.totalFlaggedEpisodes} | Críticos: {data.dataQuality.criticalCount} | Warnings: {data.dataQuality.warningCount}</p>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {data.dataQuality.topIssues.map((issue) => <li key={issue.issue}>{issue.issue}: {issue.count}</li>)}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Drill-down episódios</h2>
        <table className="w-full text-sm">
          <thead><tr><th>Título</th><th>Classificação</th><th>Status</th><th>Outcome</th><th>Sessões</th><th>Recovery</th></tr></thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.episodeId}>
                <td><Link className="text-blue-700 underline" href={`/episodes/${row.episodeId}`}>{row.title}</Link></td>
                <td>{row.analyticsLabel || "-"}</td><td>{row.status}</td><td>{row.outcomeStatus}</td><td>{row.sessionCount}</td><td>{row.recoveryDays ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-2">
          <button className="btn-brand-secondary" disabled={filters.page <= 1} onClick={() => setFilter("page", filters.page - 1)}>Anterior</button>
          <span className="text-sm">Página {data.pagination.page}</span>
          <button className="btn-brand-secondary" disabled={data.pagination.page * data.pagination.pageSize >= data.pagination.totalRows} onClick={() => setFilter("page", filters.page + 1)}>Seguinte</button>
        </div>
      </section>
    </div>
  );
}

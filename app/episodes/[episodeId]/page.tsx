import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import ScalesForm from "@/components/ScalesForm";
import ScalesList from "@/components/ScalesList";
import AlertsPanel from "@/components/AlertsPanel";
import DischargeReportEditor from "@/components/DischargeReportEditor";
import BackButton from "@/components/BackButton";
import SessionsList from "@/components/SessionsList";
import DeleteEpisodeButton from "@/components/DeleteEpisodeButton";
import EpisodeStatusEditor from "@/components/EpisodeStatusEditor";
import StatusBadge from "@/components/StatusBadge";

export default async function EpisodePage({ params }: { params: { episodeId: string } }) {
  const supabase = createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();

  const { data: episode } = await supabase.from("episode_of_care").select("*").eq("id", params.episodeId).single();
  const { data: sessions } = await supabase.from("session").select("*").eq("episode_id", params.episodeId).order("date", { ascending: false });
  const { data: scales } = await supabase.from("scale_result").select("*").eq("episode_id", params.episodeId).order("applied_at", { ascending: false });
  const { data: alerts } = await supabase.from("alert_log").select("*").eq("episode_id", params.episodeId).order("created_at", { ascending: false });
  const { data: reports } = await supabase.from("discharge_report_version").select("*").eq("episode_id", params.episodeId).order("generated_at", { ascending: false });

  return (
    <main className="container-page space-y-4">
      <div>
        <Link className="text-sm text-slate-500 hover:text-slate-700" href={`/patients/${episode?.patient_id}`}>← Voltar</Link>
      </div>

      <section className="card" id="estado">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BackButton fallbackHref={episode?.patient_id ? `/patients/${episode.patient_id}` : "/patients"} />
            <div>
              <h1 className="text-xl font-semibold">{episode?.title || "Episódio"}</h1>
              <p className="text-sm text-slate-600">{episode?.profession} / {episode?.area}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={episode?.status} />
            {episode?.start_date && (
              <span className="text-sm text-slate-500">Início: {new Date(episode.start_date).toLocaleDateString("pt-PT")}</span>
            )}
            <Link className="btn-primary" href={`/episodes/${params.episodeId}/sessions/new`}>Nova Sessão</Link>
            {episode && <DeleteEpisodeButton episodeId={episode.id} patientId={episode.patient_id} />}
          </div>
        </div>
        {episode && (
          <EpisodeStatusEditor
            episodeId={episode.id}
            initialStatus={episode.status as "ativo" | "alta" | "administrativo"}
            initialEndDate={episode.end_date ?? null}
          />
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="card">
            <h3 className="mb-2 text-lg font-semibold">Sessões</h3>
            <SessionsList sessions={sessions || []} episodeId={params.episodeId} />
          </div>

          <ScalesForm episodeId={params.episodeId} />
          <div className="card">
            <h3 className="mb-2 text-lg font-semibold">Escalas</h3>
            <ScalesList scales={scales || []} />
          </div>

          <DischargeReportEditor episodeId={params.episodeId} reports={reports || []} generatedBy={userData.user?.email || "clinician"} />
        </section>

        <aside className="space-y-4">
          <AlertsPanel alerts={alerts || []} userName={userData.user?.email || "clinician"} />
        </aside>
      </div>
    </main>
  );
}

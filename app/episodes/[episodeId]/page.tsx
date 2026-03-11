import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import ScalesForm from "@/components/ScalesForm";
import ScalesList from "@/components/ScalesList";
import AlertsPanel from "@/components/AlertsPanel";
import DischargeReportEditor from "@/components/DischargeReportEditor";
import BackButton from "@/components/BackButton";
import AuthHeader from "@/components/AuthHeader";
import SessionsList from "@/components/SessionsList";
import DeleteEpisodeButton from "@/components/DeleteEpisodeButton";
import EpisodeStatusEditor from "@/components/EpisodeStatusEditor";

export default async function EpisodePage({ params }: { params: { episodeId: string } }) {
  const supabase = createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();

  const { data: episode } = await supabase.from("episode_of_care").select("*").eq("id", params.episodeId).single();
  const { data: sessions } = await supabase.from("session").select("*").eq("episode_id", params.episodeId).order("date", { ascending: false });
  const { data: scales } = await supabase.from("scale_result").select("*").eq("episode_id", params.episodeId).order("applied_at", { ascending: false });
  const { data: alerts } = await supabase.from("alert_log").select("*").eq("episode_id", params.episodeId).order("created_at", { ascending: false });
  const { data: reports } = await supabase.from("discharge_report_version").select("*").eq("episode_id", params.episodeId).order("generated_at", { ascending: false });

  return (
    <>
      <AuthHeader />
      <main className="container-page space-y-4">
      <div>
        <Link className="link-brand-muted" href={`/patients/${episode?.patient_id}`}>← Voltar</Link>
      </div>

      <div className="card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BackButton fallbackHref={episode?.patient_id ? `/patients/${episode.patient_id}` : "/patients"} />
            <h1 className="text-xl font-semibold">{episode?.title || "Episódio"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link className="btn-brand-primary" href={`/episodes/${params.episodeId}/sessions/new`}>Nova sessão</Link>
            {episode && (
              <DeleteEpisodeButton episodeId={episode.id} patientId={episode.patient_id} />
            )}
          </div>
        </div>
        <p className="text-sm text-brand-muted">{episode?.profession} / {episode?.area}</p>
        {episode && (
          <EpisodeStatusEditor
            episodeId={episode.id}
            initialStatus={episode.status as "ativo" | "alta" | "administrativo"}
            initialEndDate={episode.end_date ?? null}
          />
        )}
      </div>

      <div className="card">
        <h3 className="mb-2 text-lg font-semibold">Sessões</h3>
        <SessionsList sessions={sessions || []} episodeId={params.episodeId} />
      </div>

      <ScalesForm episodeId={params.episodeId} />
      <div className="card">
        <h3 className="mb-2 text-lg font-semibold">Escalas</h3>
        <ScalesList scales={scales || []} />
      </div>

      <AlertsPanel alerts={alerts || []} userName={userData.user?.email || "clinician"} />
      <DischargeReportEditor episodeId={params.episodeId} reports={reports || []} generatedBy={userData.user?.email || "clinician"} />
      </main>
    </>
  );
}

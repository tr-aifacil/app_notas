import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import ScalesForm from "@/components/ScalesForm";
import AlertsPanel from "@/components/AlertsPanel";
import DischargeReportEditor from "@/components/DischargeReportEditor";
import BackButton from "@/components/BackButton";

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
      <div className="card flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <BackButton fallbackHref={episode?.patient_id ? `/patients/${episode.patient_id}` : "/patients"} />
            <h1 className="text-xl font-semibold">Episódio</h1>
          </div>
          <p className="text-sm text-slate-600">{episode?.profession} / {episode?.area} — {episode?.status}</p>
        </div>
        <Link className="btn-primary" href={`/episodes/${params.episodeId}/sessions/new`}>Nova sessão</Link>
      </div>

      <div className="card">
        <h3 className="mb-2 text-lg font-semibold">Sessões</h3>
        <ul className="space-y-2">
          {(sessions || []).map((s) => (
            <li key={s.id} className="border-b pb-2 text-sm">
              {new Date(s.date).toLocaleString("pt-PT")} — {s.type} — {s.clinician}
            </li>
          ))}
        </ul>
      </div>

      <ScalesForm episodeId={params.episodeId} />
      <div className="card">
        <h3 className="mb-2 text-lg font-semibold">Escalas</h3>
        <ul className="space-y-1 text-sm">
          {(scales || []).map((s) => (
            <li key={s.id}>{s.type}: {s.value} ({new Date(s.applied_at).toLocaleDateString("pt-PT")})</li>
          ))}
        </ul>
      </div>

      <AlertsPanel alerts={alerts || []} userName={userData.user?.email || "clinician"} />
      <DischargeReportEditor episodeId={params.episodeId} reports={reports || []} generatedBy={userData.user?.email || "clinician"} />
    </main>
  );
}

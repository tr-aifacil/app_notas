import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import BackButton from "@/components/BackButton";
import StatusBadge from "@/components/StatusBadge";
import { prettyLabel } from "@/lib/episodes/analytics";

export default async function PatientDetail({ params }: { params: { patientId: string } }) {
  const supabase = createServerSupabase();
  const { data: patient } = await supabase.from("patient").select("*").eq("id", params.patientId).single();
  const { data: episodes } = await supabase
    .from("episode_of_care")
    .select("*")
    .eq("patient_id", params.patientId)
    .order("start_date", { ascending: false });

  return (
    <main className="container-page space-y-4">
      <div>
        <Link className="text-sm text-slate-500 hover:text-slate-700" href="/patients">← Voltar</Link>
      </div>

      <section className="card">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/patients" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700">
              {patient?.name?.charAt(0)?.toUpperCase() || "P"}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Código {patient?.internal_code}</p>
              <h1 className="text-xl font-semibold text-slate-900">{patient?.name}</h1>
              <p className="text-sm text-slate-600">Resumo de episódios clínicos e evolução terapêutica.</p>
            </div>
          </div>
          <Link className="btn-primary" href={`/patients/${params.patientId}/episodes/new`}>Novo episódio</Link>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold">Episódios clínicos</h2>
          <span className="text-sm text-slate-600">{(episodes || []).length} episódios</span>
        </div>
        <ul className="space-y-2">
          {(episodes || []).map((episode) => (
            <li key={episode.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{episode.title}</p>
                <p className="text-xs text-slate-600">{episode.profession} / {episode.area}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {[episode.body_region, episode.condition_type, episode.condition_chronicity, episode.case_type].filter(Boolean).map((item, index) => (
                    <span key={`${episode.id}-${item}-${index}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{prettyLabel(item)}</span>
                  ))}
                  {!episode.analytics_included && <span className="text-xs text-slate-500">Excluído das métricas de recovery</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={episode.status} />
                <Link className="btn-secondary px-3 py-1.5 text-xs" href={`/episodes/${episode.id}`}>Detalhes</Link>
                <Link className="btn-secondary px-3 py-1.5 text-xs" href={`/episodes/${episode.id}#estado`}>Editar</Link>
              </div>
            </li>
          ))}
          {episodes?.length === 0 && <li className="text-sm text-slate-500">Sem episódios registados.</li>}
        </ul>
      </section>
    </main>
  );
}

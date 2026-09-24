import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import BackButton from "@/components/BackButton";
import StatusBadge from "@/components/StatusBadge";
import EpisodeClassificationBadges from "@/components/EpisodeClassificationBadges";
import PatientAdminPanel from "@/components/PatientAdminPanel";
import { notFound } from "next/navigation";

export default async function PatientDetail({ params }: { params: { patientId: string } }) {
  const supabase = createServerSupabase();
  const { data: patient } = await supabase.from("patient").select("*").eq("id", params.patientId).single();
  if (!patient) notFound();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: ownProfile } = user ? await supabase.from("profile").select("role").eq("id", user.id).single() : { data: null };
  const isAdmin = ownProfile?.role === "admin";
  const { data: episodes } = await supabase
    .from("episode_of_care")
    .select("*")
    .eq("patient_id", params.patientId)
    .is("archived_at", null)
    .order("start_date", { ascending: false });
  const [cliniciansResult, accessResult, archivedResult] = isAdmin ? await Promise.all([
    supabase.from("profile").select("id, display_name").eq("role", "clinician").order("display_name"),
    supabase.from("patient_access").select("clinician_id").eq("patient_id", params.patientId),
    supabase.from("episode_of_care").select("id, title").eq("patient_id", params.patientId).not("archived_at", "is", null)
  ]) : [{ data: [] }, { data: [] }, { data: [] }];

  return (
    <main className="container-page space-y-4">

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
          <Link className="btn-brand-primary" href={`/patients/${params.patientId}/episodes/new`}>Novo episódio</Link>
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
                <EpisodeClassificationBadges
                  bodyRegion={episode.body_region}
                  conditionType={episode.condition_type}
                  conditionChronicity={episode.condition_chronicity}
                  caseType={episode.case_type}
                  laterality={episode.laterality}
                  analyticsIncluded={episode.analytics_included}
                  showLaterality
                />
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={episode.status} />
                <Link className="btn-brand-outline px-3 py-1.5 text-xs" href={`/episodes/${episode.id}`}>Detalhes</Link>
                <Link className="btn-brand-outline px-3 py-1.5 text-xs" href={`/episodes/${episode.id}#estado`}>Editar</Link>
              </div>
            </li>
          ))}
          {episodes?.length === 0 && <li className="text-sm text-slate-500">Sem episódios registados.</li>}
        </ul>
      </section>

      {isAdmin && <PatientAdminPanel patientId={patient.id} clinicians={cliniciansResult.data || []} access={accessResult.data || []} archivedEpisodes={archivedResult.data || []} />}
    </main>
  );
}

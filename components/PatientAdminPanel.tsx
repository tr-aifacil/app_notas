"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Clinician = { id: string; display_name: string };
type Access = { clinician_id: string };
type ArchivedEpisode = { id: string; title: string };

export default function PatientAdminPanel({ patientId, clinicians, access, archivedEpisodes }: {
  patientId: string;
  clinicians: Clinician[];
  access: Access[];
  archivedEpisodes: ArchivedEpisode[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const assigned = new Set(access.map((item) => item.clinician_id));

  const grant = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    const { error: dbError } = await supabase.from("patient_access").insert({ patient_id: patientId, clinician_id: selected });
    setBusy(false);
    if (dbError) return setError("Não foi possível atribuir o acesso.");
    setSelected("");
    router.refresh();
  };

  const revoke = async (clinicianId: string) => {
    setBusy(true);
    setError("");
    const { error: dbError } = await supabase.from("patient_access")
      .delete().eq("patient_id", patientId).eq("clinician_id", clinicianId).select("patient_id").single();
    setBusy(false);
    if (dbError) return setError("Não foi possível retirar o acesso.");
    router.refresh();
  };

  const restore = async (episodeId: string) => {
    setBusy(true);
    setError("");
    const { error: dbError } = await supabase.from("episode_of_care")
      .update({ archived_at: null, archived_by: null }).eq("id", episodeId).select("id").single();
    setBusy(false);
    if (dbError) return setError("Não foi possível recuperar o episódio.");
    router.refresh();
  };

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Administração do utente</h2>
      <div>
        <h3 className="mb-2 font-medium">Fisioterapeutas com acesso</h3>
        <ul className="space-y-2">
          {clinicians.filter((clinician) => assigned.has(clinician.id)).map((clinician) => (
            <li key={clinician.id} className="flex items-center justify-between gap-2">
              <span>{clinician.display_name}</span>
              <button className="btn-state-danger-outline" disabled={busy} onClick={() => revoke(clinician.id)} type="button">Retirar acesso</button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <label className="label" htmlFor="grant-clinician">Atribuir fisioterapeuta</label>
            <select className="input" id="grant-clinician" value={selected} onChange={(event) => setSelected(event.target.value)}>
              <option value="">Selecionar</option>
              {clinicians.filter((clinician) => !assigned.has(clinician.id)).map((clinician) => (
                <option key={clinician.id} value={clinician.id}>{clinician.display_name}</option>
              ))}
            </select>
          </div>
          <button className="btn-brand-primary" disabled={!selected || busy} onClick={grant} type="button">Dar acesso</button>
        </div>
      </div>
      {archivedEpisodes.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">Episódios arquivados</h3>
          <ul className="space-y-2">
            {archivedEpisodes.map((episode) => (
              <li key={episode.id} className="flex items-center justify-between gap-2">
                <span>{episode.title}</span>
                <button className="btn-brand-secondary" disabled={busy} onClick={() => restore(episode.id)} type="button">Recuperar</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="text-sm text-state-error" role="alert">{error}</p>}
    </section>
  );
}

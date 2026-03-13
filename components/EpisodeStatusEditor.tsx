"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "ativo" | "alta" | "administrativo";
type OutcomeStatus = "ongoing" | "recovered" | "dropout" | "referred_out" | "administrative_close" | "unknown";

type Props = {
  episodeId: string;
  initialStatus: Status;
  initialEndDate: string | null;
  initialOutcomeStatus: OutcomeStatus;
  initialOutcomeDate: string | null;
};

export default function EpisodeStatusEditor({
  episodeId,
  initialStatus,
  initialEndDate,
  initialOutcomeStatus,
  initialOutcomeDate,
}: Props) {
  const supabase = createClient();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [endDate, setEndDate] = useState(initialEndDate ?? "");
  const [outcomeStatus, setOutcomeStatus] = useState<OutcomeStatus>(initialOutcomeStatus);
  const [outcomeDate, setOutcomeDate] = useState(initialOutcomeDate ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isClosed = status !== "ativo";

  const save = async () => {
    setSaving(true);
    setSaved(false);

    const nextOutcomeStatus: OutcomeStatus = isClosed
      ? (outcomeStatus === "ongoing" ? "unknown" : outcomeStatus)
      : "ongoing";

    await supabase
      .from("episode_of_care")
      .update({
        status,
        end_date: endDate || null,
        outcome_status: nextOutcomeStatus,
        outcome_date: nextOutcomeStatus === "ongoing" ? null : (outcomeDate || null),
      })
      .eq("id", episodeId);

    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <div>
        <label className="label">Estado</label>
        <select
          className="input"
          value={status}
          onChange={(e) => { setStatus(e.target.value as Status); setSaved(false); }}
        >
          <option value="ativo">Ativo</option>
          <option value="alta">Concluído (Alta)</option>
          <option value="administrativo">Concluído (Administrativo)</option>
        </select>
      </div>
      <div>
        <label className="label">Data de fim</label>
        <input className="input" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setSaved(false); }} />
      </div>
      <div>
        <label className="label">Outcome (analytics)</label>
        <select
          className="input"
          value={isClosed ? outcomeStatus : "ongoing"}
          disabled={!isClosed}
          onChange={(e) => { setOutcomeStatus(e.target.value as OutcomeStatus); setSaved(false); }}
        >
          <option value="ongoing">ongoing</option>
          <option value="recovered">recovered</option>
          <option value="dropout">dropout</option>
          <option value="referred_out">referred_out</option>
          <option value="administrative_close">administrative_close</option>
          <option value="unknown">unknown</option>
        </select>
      </div>
      <div>
        <label className="label">Data outcome</label>
        <input className="input" type="date" value={outcomeDate} disabled={!isClosed} onChange={(e) => { setOutcomeDate(e.target.value); setSaved(false); }} />
      </div>
      <button className="btn-brand-primary" onClick={save} disabled={saving}>{saving ? "A guardar..." : "Guardar estado"}</button>
      {saved && <span className="text-sm text-emerald-700">Guardado.</span>}
    </div>
  );
}

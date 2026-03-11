"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "ativo" | "alta" | "administrativo";

type Props = {
  episodeId: string;
  initialStatus: Status;
  initialEndDate: string | null;
};

export default function EpisodeStatusEditor({ episodeId, initialStatus, initialEndDate }: Props) {
  const supabase = createClient();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [endDate, setEndDate] = useState(initialEndDate ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await supabase
      .from("episode_of_care")
      .update({ status, end_date: endDate || null })
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
          <option value="ativo">ativo</option>
          <option value="alta">alta</option>
          <option value="administrativo">administrativo</option>
        </select>
      </div>
      <div>
        <label className="label">Data de fim</label>
        <input
          className="input"
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setSaved(false); }}
        />
      </div>
      <div className="flex items-center gap-2 pb-1">
        <button className="btn-brand-primary" onClick={save} disabled={saving} type="button">
          {saving ? "A guardar..." : "Guardar episódio"}
        </button>
        {saved && <span className="text-sm text-state-success">✓ Guardado</span>}
      </div>
    </div>
  );
}

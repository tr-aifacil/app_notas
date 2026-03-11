"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EpisodeMetadataEditor({
  episodeId,
  initialTitle,
  initialEpisodeLabel,
}: {
  episodeId: string;
  initialTitle: string;
  initialEpisodeLabel: string | null;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(initialTitle);
  const [episodeLabel, setEpisodeLabel] = useState(initialEpisodeLabel ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase
      .from("episode_of_care")
      .update({ title: title.trim(), episode_label: episodeLabel.trim() || null })
      .eq("id", episodeId);
    setSaving(false);
  };

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <div>
        <label className="label">Título do episódio</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        <p className="text-xs text-slate-500">Título legível para contexto clínico diário.</p>
      </div>
      <div>
        <label className="label">Episode label (analytics)</label>
        <input className="input" value={episodeLabel} onChange={(e) => setEpisodeLabel(e.target.value)} />
        <p className="text-xs text-slate-500">Label normalizada para análises de coorte e recovery.</p>
      </div>
      <div>
        <button className="btn-secondary" type="button" onClick={save} disabled={saving}>{saving ? "A guardar..." : "Guardar metadados"}</button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteEpisodeButton({ episodeId, patientId }: { episodeId: string; patientId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const deleteEpisode = async () => {
    setBusy(true);
    setError("");
    const { error: archiveError } = await supabase.from("episode_of_care")
      .update({ archived_at: new Date().toISOString() }).eq("id", episodeId).select("id").single();
    setBusy(false);
    if (archiveError) {
      setError("Não foi possível arquivar o episódio. Tenta novamente.");
      return;
    }
    router.push(`/patients/${patientId}`);
  };

  if (!confirm) {
    return (
      <button
        className="btn-state-danger-outline"
        onClick={() => setConfirm(true)}
        type="button"
      >
        Arquivar episódio
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-state-error">Arquivar este episódio? O administrador poderá recuperá-lo.</span>
      <button
        className="btn-state-danger"
        onClick={deleteEpisode}
        disabled={busy}
        type="button"
      >
        {busy ? "A arquivar..." : "Confirmar arquivo"}
      </button>
      {error && <span className="text-sm text-state-error" role="alert">{error}</span>}
      <button
        className="btn-brand-secondary px-3 py-2 text-sm"
        onClick={() => setConfirm(false)}
        type="button"
      >
        Cancelar
      </button>
    </span>
  );
}

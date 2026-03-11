"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteEpisodeButton({ episodeId, patientId }: { episodeId: string; patientId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  const deleteEpisode = async () => {
    await supabase.from("episode_of_care").delete().eq("id", episodeId);
    router.push(`/patients/${patientId}`);
  };

  if (!confirm) {
    return (
      <button
        className="btn-state-danger-outline py-1 text-sm"
        onClick={() => setConfirm(true)}
        type="button"
      >
        Eliminar episódio
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="text-sm text-state-error">Tem a certeza?</span>
      <button
        className="btn-state-danger py-1 text-sm"
        onClick={deleteEpisode}
        type="button"
      >
        Confirmar
      </button>
      <button
        className="btn-brand-secondary py-1 px-3 text-sm"
        onClick={() => setConfirm(false)}
        type="button"
      >
        Cancelar
      </button>
    </span>
  );
}

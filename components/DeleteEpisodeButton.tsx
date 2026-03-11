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
        className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        onClick={() => setConfirm(true)}
        type="button"
      >
        Eliminar Episódio
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="text-sm text-red-600">Tem a certeza?</span>
      <button
        className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        onClick={deleteEpisode}
        type="button"
      >
        Confirmar
      </button>
      <button
        className="btn-secondary px-3 py-2 text-sm"
        onClick={() => setConfirm(false)}
        type="button"
      >
        Cancelar
      </button>
    </span>
  );
}

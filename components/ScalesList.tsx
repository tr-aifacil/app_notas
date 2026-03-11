"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Scale = {
  id: string;
  type: string;
  value: number;
  applied_at: string;
};

export default function ScalesList({ scales }: { scales: Scale[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const deleteScale = async (id: string) => {
    await supabase.from("scale_result").delete().eq("id", id);
    setConfirmDeleteId(null);
    router.refresh();
  };

  if (scales.length === 0) {
    return <p className="text-sm text-brand-muted">Nenhuma escala registada.</p>;
  }

  return (
    <ul className="space-y-1 text-sm">
      {scales.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-2 border-b py-1">
          <span>
            {s.type}: {s.value} ({new Date(s.applied_at).toLocaleDateString("pt-PT")})
          </span>
          {confirmDeleteId === s.id ? (
            <span className="flex items-center gap-1">
              <button
                className="btn-state-danger px-2 py-0.5 text-xs"
                onClick={() => deleteScale(s.id)}
                type="button"
              >
                Confirmar
              </button>
              <button
                className="btn-brand-secondary py-0.5 px-2 text-xs"
                onClick={() => setConfirmDeleteId(null)}
                type="button"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              className="btn-state-danger-outline px-2 py-0.5 text-xs"
              onClick={() => setConfirmDeleteId(s.id)}
              type="button"
            >
              Eliminar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

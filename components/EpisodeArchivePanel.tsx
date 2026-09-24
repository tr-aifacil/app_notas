"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDatePT } from "@/lib/utils/formatDate";

type ArchivedSession = { id: string; date: string };
type ArchivedScale = { id: string; type: string; applied_at: string };

export default function EpisodeArchivePanel({ sessions, scales }: { sessions: ArchivedSession[]; scales: ArchivedScale[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (sessions.length === 0 && scales.length === 0) return null;

  const restore = async (table: "session" | "scale_result", id: string) => {
    setBusy(true);
    setError("");
    const { error: dbError } = await supabase.from(table).update({ archived_at: null, archived_by: null }).eq("id", id).select("id").single();
    setBusy(false);
    if (dbError) return setError("Não foi possível recuperar o registo.");
    router.refresh();
  };

  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold">Registos arquivados</h2>
      {sessions.map((item) => (
        <div className="flex items-center justify-between gap-2" key={item.id}>
          <span>Sessão de {formatDatePT(item.date)}</span>
          <button className="btn-brand-secondary" disabled={busy} onClick={() => restore("session", item.id)} type="button">Recuperar</button>
        </div>
      ))}
      {scales.map((item) => (
        <div className="flex items-center justify-between gap-2" key={item.id}>
          <span>{item.type} de {formatDatePT(item.applied_at)}</span>
          <button className="btn-brand-secondary" disabled={busy} onClick={() => restore("scale_result", item.id)} type="button">Recuperar</button>
        </div>
      ))}
      {error && <p className="text-sm text-state-error" role="alert">{error}</p>}
    </section>
  );
}

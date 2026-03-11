"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Session = {
  id: string;
  date: string;
  type: string;
  clinician: string;
  subjective: string | null;
  objective: string | null;
  clinical_analysis: string | null;
  intervention: string | null;
  response: string | null;
  plan: string | null;
};

const sectionLabels: { key: keyof Session; label: string }[] = [
  { key: "subjective", label: "Avaliação Subjetiva" },
  { key: "objective", label: "Avaliação Objetiva" },
  { key: "clinical_analysis", label: "Análise Clínica" },
  { key: "intervention", label: "Intervenção" },
  { key: "response", label: "Resposta" },
  { key: "plan", label: "Plano" },
];

export default function SessionsList({ sessions, episodeId }: { sessions: Session[]; episodeId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const deleteSession = async (sessionId: string) => {
    await supabase.from("session").delete().eq("id", sessionId);
    setConfirmDeleteId(null);
    router.refresh();
  };

  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li key={s.id} className="rounded-md border border-slate-200 px-3 py-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-brand-foreground">
              {new Date(s.date).toLocaleString("pt-PT")} — {s.type} — {s.clinician}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn-secondary px-3 py-1.5 text-xs"
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                type="button"
              >
                {expandedId === s.id ? "Fechar" : "Detalhes"}
              </button>
              <Link
                className="btn-secondary px-3 py-1.5 text-xs"
                href={`/episodes/${episodeId}/sessions/${s.id}/edit`}
              >
                Editar
              </Link>
              {confirmDeleteId === s.id ? (
                <span className="flex items-center gap-2">
                  <button
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    onClick={() => deleteSession(s.id)}
                    type="button"
                  >
                    Confirmar
                  </button>
                  <button
                    className="btn-secondary px-3 py-1.5 text-xs"
                    onClick={() => setConfirmDeleteId(null)}
                    type="button"
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  onClick={() => setConfirmDeleteId(s.id)}
                  type="button"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          {expandedId === s.id && (
            <div className="mt-3 space-y-2 rounded bg-brand-bg p-3">
              {sectionLabels.map(({ key, label }) =>
                s[key] ? (
                  <div key={key}>
                    <p className="font-medium text-brand-muted">{label}</p>
                    <p className="whitespace-pre-wrap text-brand-foreground">{s[key] as string}</p>
                  </div>
                ) : null
              )}
            </div>
          )}
        </li>
      ))}
      {sessions.length === 0 && <li className="text-sm text-slate-500">Sem sessões registadas.</li>}
    </ul>
  );
}

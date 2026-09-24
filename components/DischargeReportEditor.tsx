"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDatePT } from "@/lib/utils/formatDate";
import { useToast } from "@/components/ToastProvider";
import Spinner from "@/components/Spinner";

type Report = { id: string; content: string; is_final: boolean; generated_at: string };

export default function DischargeReportEditor({
  episodeId,
  reports,
  generatedBy
}: {
  episodeId: string;
  reports: Report[];
  generatedBy: string;
}) {
  const supabase = createClient();
  const { success, error: toastError } = useToast();
  const [content, setContent] = useState(reports[0]?.content || "");
  const [isFinal, setIsFinal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/discharge-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode_id: episodeId })
      });
      const json = await res.json();
      if (!res.ok) {
        toastError(json.error || "Não foi possível gerar o relatório.");
        return;
      }
      setContent(json.content || "");
      success("Relatório gerado e guardado");
      location.reload();
    } catch {
      toastError("Erro de ligação ao gerar o relatório.");
    } finally {
      setGenerating(false);
    }
  };

  const saveVersion = async () => {
    setSaving(true);
    const res = await fetch(`/api/episodes/${episodeId}/snapshot`, { method: "GET" });
    const snapshot = res.ok ? await res.json() : {};
    const { error: insertError } = await supabase.from("discharge_report_version").insert({
      episode_id: episodeId,
      generated_by: generatedBy || "clinician",
      content,
      source_snapshot: snapshot,
      is_final: isFinal
    });
    setSaving(false);
    if (insertError) {
      toastError("Erro ao guardar");
      return;
    }
    success("Guardado com sucesso");
    location.reload();
  };

  return (
    <div className="card space-y-3">
      <h3 className="text-lg font-semibold">Relatório de Alta (versionado)</h3>
      <p className="text-sm text-brand-muted">Ao gerar, o texto clínico editado e as escalas são enviados à OpenAI. O código interno é substituído por um marcador e as transcrições originais não são enviadas. Evita nomes e outros identificadores no texto livre. Revê o relatório antes de o utilizar.</p>
      <div className="flex gap-2">
        <button className="btn-brand-primary" disabled={generating} onClick={generate}>
          {generating ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" />A guardar...</span> : "Gerar Relatório de Alta"}
        </button>
      </div>
      <label className="label" htmlFor="report-content">Texto do relatório para revisão</label>
      <textarea id="report-content" className="input min-h-64" value={content} onChange={(e) => setContent(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />
        Marcar como final
      </label>
      <button className="btn-brand-secondary" disabled={saving} onClick={saveVersion}>
        {saving ? "A guardar..." : "Guardar nova versão"}
      </button>

      <div>
        <p className="mb-2 text-sm font-medium">Versões:</p>
        <ul className="space-y-1 text-sm">
          {reports.map((r) => (
            <li key={r.id}>
              {formatDatePT(r.generated_at)} {r.is_final ? "(final)" : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

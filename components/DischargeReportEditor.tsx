"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const [content, setContent] = useState(reports[0]?.content || "");
  const [isFinal, setIsFinal] = useState(false);

  const generate = async () => {
    const res = await fetch("/api/ai/discharge-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episode_id: episodeId })
    });
    const json = await res.json();
    setContent(json.content || "");
    location.reload();
  };

  const saveVersion = async () => {
    const res = await fetch(`/api/episodes/${episodeId}/snapshot`, { method: "GET" });
    const snapshot = res.ok ? await res.json() : {};
    await supabase.from("discharge_report_version").insert({
      episode_id: episodeId,
      generated_by: generatedBy || "clinician",
      content,
      source_snapshot: snapshot,
      is_final: isFinal
    });
    location.reload();
  };

  return (
    <div className="card space-y-3">
      <h3 className="text-lg font-semibold">Relatório de Alta (versionado)</h3>
      <div className="flex gap-2">
        <button className="btn-primary" onClick={generate}>Gerar Relatório de Alta</button>
      </div>
      <textarea className="input min-h-64" value={content} onChange={(e) => setContent(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />
        Marcar como final
      </label>
      <button className="btn-secondary" onClick={saveVersion}>Guardar nova versão</button>

      <div>
        <p className="mb-2 text-sm font-medium">Versões:</p>
        <ul className="space-y-1 text-sm">
          {reports.map((r) => (
            <li key={r.id}>
              {new Date(r.generated_at).toLocaleString("pt-PT")} {r.is_final ? "(final)" : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

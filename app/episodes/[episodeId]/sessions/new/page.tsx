"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SectionCard from "@/components/SectionCard";

type S = "subjective" | "objective" | "clinical_analysis" | "intervention" | "response" | "plan";
const sections: { key: S; title: string }[] = [
  { key: "subjective", title: "Avaliação Subjetiva" },
  { key: "objective", title: "Avaliação Objetiva" },
  { key: "clinical_analysis", title: "Análise Clínica" },
  { key: "intervention", title: "Intervenção" },
  { key: "response", title: "Resposta" },
  { key: "plan", title: "Plano" }
];

export default function NewSessionPage() {
  const params = useParams<{ episodeId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [sessionType, setSessionType] = useState<"avaliacao" | "tratamento" | "reavaliacao" | "alta">("tratamento");
  const [clinician, setClinician] = useState("");
  const [transcripts, setTranscripts] = useState<Record<S, string>>({
    subjective: "", objective: "", clinical_analysis: "", intervention: "", response: "", plan: ""
  });
  const [finalTexts, setFinalTexts] = useState<Record<S, string>>({
    subjective: "", objective: "", clinical_analysis: "", intervention: "", response: "", plan: ""
  });

  const save = async () => {
    const { data } = await supabase
      .from("session")
      .insert({
        episode_id: params.episodeId,
        date: new Date().toISOString(),
        clinician,
        type: sessionType,
        subjective: finalTexts.subjective,
        objective: finalTexts.objective,
        clinical_analysis: finalTexts.clinical_analysis,
        intervention: finalTexts.intervention,
        response: finalTexts.response,
        plan: finalTexts.plan,
        subjective_transcript: transcripts.subjective,
        objective_transcript: transcripts.objective,
        clinical_analysis_transcript: transcripts.clinical_analysis,
        intervention_transcript: transcripts.intervention,
        response_transcript: transcripts.response,
        plan_transcript: transcripts.plan
      })
      .select("id")
      .single();

    if (data?.id) {
      await fetch("/api/alerts/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode_id: params.episodeId, session_id: data.id })
      });
    }

    router.push(`/episodes/${params.episodeId}`);
  };

  return (
    <main className="container-page space-y-4">
      <h1 className="text-2xl font-semibold">Registo de Sessão Clínica</h1>

      <div className="card grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Tipo de sessão</label>
          <select className="input" value={sessionType} onChange={(e) => setSessionType(e.target.value as typeof sessionType)}>
            <option value="avaliacao">avaliação</option>
            <option value="tratamento">tratamento</option>
            <option value="reavaliacao">reavaliação</option>
            <option value="alta">alta</option>
          </select>
        </div>
        <div>
          <label className="label">Clínico</label>
          <input className="input" value={clinician} onChange={(e) => setClinician(e.target.value)} required />
        </div>
      </div>

      {sections.map((s) => (
        <SectionCard
          key={s.key}
          section={s.key}
          title={s.title}
          transcript={transcripts[s.key]}
          finalText={finalTexts[s.key]}
          onChangeTranscript={(v) => setTranscripts((p) => ({ ...p, [s.key]: v }))}
          onChangeFinalText={(v) => setFinalTexts((p) => ({ ...p, [s.key]: v }))}
        />
      ))}

      <div className="sticky bottom-4">
        <button className="btn-primary" onClick={save}>Validar e Guardar</button>
      </div>
    </main>
  );
}

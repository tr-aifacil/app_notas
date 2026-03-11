"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SectionCard from "@/components/SectionCard";
import BackButton from "@/components/BackButton";

type S = "subjective" | "objective" | "clinical_analysis" | "intervention" | "response" | "plan";

const sections: { key: S; title: string }[] = [
  { key: "subjective", title: "Avaliação Subjetiva" },
  { key: "objective", title: "Avaliação Objetiva" },
  { key: "clinical_analysis", title: "Análise Clínica" },
  { key: "intervention", title: "Intervenção" },
  { key: "response", title: "Resposta" },
  { key: "plan", title: "Plano" },
];

export default function EditSessionPage() {
  const params = useParams<{ episodeId: string; sessionId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState<"avaliacao" | "tratamento" | "reavaliacao" | "alta">("tratamento");
  const [clinician, setClinician] = useState("");
  const [clinicianId, setClinicianId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState("");
  const [transcripts, setTranscripts] = useState<Record<S, string>>({
    subjective: "", objective: "", clinical_analysis: "", intervention: "", response: "", plan: "",
  });
  const [finalTexts, setFinalTexts] = useState<Record<S, string>>({
    subjective: "", objective: "", clinical_analysis: "", intervention: "", response: "", plan: "",
  });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savedGeneral, setSavedGeneral] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: sessionData }, { data: authData }] = await Promise.all([
        supabase
          .from("session")
          .select("*")
          .eq("id", params.sessionId)
          .single(),
        supabase.auth.getUser(),
      ]);

      if (sessionData) {
        setSessionType(sessionData.type as typeof sessionType);
        setClinician(sessionData.clinician ?? "");
        setClinicianId(sessionData.clinician_id ?? authData.user?.id ?? null);
        setSessionDate(sessionData.date ? new Date(sessionData.date).toISOString().slice(0, 10) : "");
        setTranscripts({
          subjective: sessionData.subjective_transcript ?? "",
          objective: sessionData.objective_transcript ?? "",
          clinical_analysis: sessionData.clinical_analysis_transcript ?? "",
          intervention: sessionData.intervention_transcript ?? "",
          response: sessionData.response_transcript ?? "",
          plan: sessionData.plan_transcript ?? "",
        });
        setFinalTexts({
          subjective: sessionData.subjective ?? "",
          objective: sessionData.objective ?? "",
          clinical_analysis: sessionData.clinical_analysis ?? "",
          intervention: sessionData.intervention ?? "",
          response: sessionData.response ?? "",
          plan: sessionData.plan ?? "",
        });
      }
      setLoading(false);
    };
    load();
  }, [params.sessionId]);

  const saveGeneral = async () => {
    setSavingGeneral(true);
    setSavedGeneral(false);
    await supabase
      .from("session")
      .update({
        type: sessionType,
        clinician: clinician.trim() || null,
        clinician_id: clinicianId,
        date: sessionDate ? new Date(sessionDate).toISOString() : undefined
      })
      .eq("id", params.sessionId);
    setSavingGeneral(false);
    setSavedGeneral(true);
  };

  const saveSection = (key: S) => async (transcript: string, finalText: string) => {
    await supabase
      .from("session")
      .update({
        [key]: finalText,
        [`${key}_transcript`]: transcript,
      })
      .eq("id", params.sessionId);
  };

  if (loading) return <main className="container-page"><p className="text-slate-500">A carregar...</p></main>;

  return (
    <main className="container-page space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref={`/episodes/${params.episodeId}`} />
        <h1 className="text-2xl font-semibold">Editar Sessão</h1>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Dados gerais</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="label">Tipo de sessão</label>
            <select
              className="input"
              value={sessionType}
              onChange={(e) => { setSessionType(e.target.value as typeof sessionType); setSavedGeneral(false); }}
            >
              <option value="avaliacao">avaliação</option>
              <option value="tratamento">tratamento</option>
              <option value="reavaliacao">reavaliação</option>
              <option value="alta">alta</option>
            </select>
          </div>
          <div>
            <label className="label">Clínico</label>
            <input
              className="input"
              value={clinician}
              onChange={(e) => { setClinician(e.target.value); setSavedGeneral(false); }}
            />
          </div>
          <div>
            <label className="label">Data</label>
            <input
              className="input"
              type="date"
              value={sessionDate}
              onChange={(e) => { setSessionDate(e.target.value); setSavedGeneral(false); }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button className="btn-primary" onClick={saveGeneral} disabled={savingGeneral} type="button">
            {savingGeneral ? "A guardar..." : "Guardar dados gerais"}
          </button>
          {savedGeneral && <span className="text-sm text-green-600">✓ Guardado</span>}
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
          onSave={saveSection(s.key)}
        />
      ))}

      <div className="pb-6" />
    </main>
  );
}

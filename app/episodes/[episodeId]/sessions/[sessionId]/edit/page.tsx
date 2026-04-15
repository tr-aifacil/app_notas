"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SectionCard from "@/components/SectionCard";
import BackButton from "@/components/BackButton";
import AuthHeader from "@/components/AuthHeader";
import { useToast } from "@/components/ToastProvider";

type S = "subjective" | "objective" | "clinical_analysis" | "intervention" | "response" | "plan";

const sections: { key: S; title: string; description?: string }[] = [
  { key: "subjective", title: "Avaliação Subjetiva", description: "Registo da informação subjetiva reportada pelo utente" },
  { key: "objective", title: "Avaliação Objetiva", description: "Registo dos achados objetivos observados na avaliação" },
  { key: "clinical_analysis", title: "Análise Clínica", description: "Interpretação clínica dos achados e enquadramento do caso" },
  { key: "intervention", title: "Intervenção", description: "Registo do tratamento realizado na sessão" },
  {
    key: "response",
    title: "Resposta",
    description: "Registo da resposta do utente à sessão, durante a sessão ou em follow-up"
  },
  {
    key: "plan",
    title: "Plano",
    description: "Registo do plano para as próximas sessões, incluindo progressão de carga ou ajustes de intervenção"
  },
];

export default function EditSessionPage() {
  const params = useParams<{ episodeId: string; sessionId: string }>();
  const supabase = createClient();
  const { success, error: toastError } = useToast();

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
  const [generalError, setGeneralError] = useState<string | null>(null);

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
        setSessionDate(sessionData.date || "");
        setTranscripts({
          subjective: sessionData.subjective_transcript ?? "",
          objective: sessionData.objective_transcript ?? "",
          clinical_analysis: sessionData.clinical_analysis_transcript ?? "",
          intervention: sessionData.intervention_transcript ?? "",
          response: sessionData.response_transcript ?? "",
          plan: sessionData.plan_transcript ?? "",
        });
        setFinalTexts({
          subjective: sessionData.subjective ?? sessionData.subjective_transcript ?? "",
          objective: sessionData.objective ?? sessionData.objective_transcript ?? "",
          clinical_analysis: sessionData.clinical_analysis ?? sessionData.clinical_analysis_transcript ?? "",
          intervention: sessionData.intervention ?? sessionData.intervention_transcript ?? "",
          response: sessionData.response ?? sessionData.response_transcript ?? "",
          plan: sessionData.plan ?? sessionData.plan_transcript ?? "",
        });
      }
      setLoading(false);
    };
    load();
  }, [params.sessionId]);

  const saveGeneral = async () => {
    setSavingGeneral(true);
    setSavedGeneral(false);
    setGeneralError(null);

    try {
      const { error } = await supabase
        .from("session")
        .update({
          type: sessionType,
          clinician: clinician.trim() || null,
          clinician_id: clinicianId,
          date: sessionDate || undefined
        })
        .eq("id", params.sessionId);

      if (error) {
        throw new Error(error.message);
      }

      setSavedGeneral(true);
      success("Guardado com sucesso");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao guardar dados gerais.";
      setGeneralError(msg);
      toastError("Erro ao guardar");
    } finally {
      setSavingGeneral(false);
    }
  };

  const saveSection = (key: S) => async (transcript: string, finalText: string) => {
    const { error } = await supabase
      .from("session")
      .update({
        [key]: finalText,
        [`${key}_transcript`]: transcript,
      })
      .eq("id", params.sessionId);

    if (error) {
      throw new Error(error.message);
    }
  };

  if (loading) return <main className="container-page"><p className="text-brand-muted">A carregar...</p></main>;

  return (
    <>
      <AuthHeader />
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
              onChange={(e) => { setSessionType(e.target.value as typeof sessionType); setSavedGeneral(false); setGeneralError(null); }}
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
              onChange={(e) => { setClinician(e.target.value); setSavedGeneral(false); setGeneralError(null); }}
            />
          </div>
          <div>
            <label className="label">Data</label>
            <input
              className="input"
              type="date"
              value={sessionDate}
              onChange={(e) => { setSessionDate(e.target.value); setSavedGeneral(false); setGeneralError(null); }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button className="btn-brand-primary" onClick={saveGeneral} disabled={savingGeneral} type="button">
            {savingGeneral ? "A guardar..." : "Guardar dados gerais"}
          </button>
          {savedGeneral && <span className="text-sm text-state-success">✓ Guardado</span>}
          {generalError && <span className="text-sm text-state-error">{generalError}</span>}
        </div>
      </div>

      {sections.map((s) => (
        <SectionCard
          key={s.key}
          section={s.key}
          title={s.title}
          description={s.description}
          transcript={transcripts[s.key]}
          finalText={finalTexts[s.key]}
          onChangeTranscript={(v) => setTranscripts((p) => ({ ...p, [s.key]: v }))}
          onChangeFinalText={(v) => {
            setFinalTexts((p) => ({ ...p, [s.key]: v }));
            setTranscripts((p) => ({ ...p, [s.key]: v }));
          }}
          onSave={saveSection(s.key)}
        />
      ))}

      <div className="pb-6" />
      </main>
    </>
  );
}

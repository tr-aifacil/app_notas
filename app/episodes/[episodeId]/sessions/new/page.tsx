"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SectionCard from "@/components/SectionCard";
import AuthHeader from "@/components/AuthHeader";
import { useToast } from "@/components/ToastProvider";
import Spinner from "@/components/Spinner";

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
  }
];

export default function NewSessionPage() {
  const params = useParams<{ episodeId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { success, error: toastError } = useToast();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"avaliacao" | "tratamento" | "reavaliacao" | "alta">("tratamento");
  const [clinician, setClinician] = useState("");
  const [clinicianId, setClinicianId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [transcripts, setTranscripts] = useState<Record<S, string>>({
    subjective: "", objective: "", clinical_analysis: "", intervention: "", response: "", plan: ""
  });
  const [finalTexts, setFinalTexts] = useState<Record<S, string>>({
    subjective: "", objective: "", clinical_analysis: "", intervention: "", response: "", plan: ""
  });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savedGeneral, setSavedGeneral] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user?.id) return;
      setClinicianId(data.user.id);

      const { data: profile } = await supabase
        .from("profile")
        .select("display_name")
        .eq("id", data.user.id)
        .single();

      if (profile?.display_name) {
        setClinician(profile.display_name);
      }
    };
    loadCurrentUser();
  }, [supabase]);

  const ensureSession = async () => {
    if (sessionId) return sessionId;

    const { data, error } = await supabase
      .from("session")
      .insert({
        episode_id: params.episodeId,
        date: sessionDate || new Date().toISOString().slice(0, 10),
        clinician: clinician.trim() || null,
        clinician_id: clinicianId,
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

    if (error || !data?.id) {
      throw new Error(error?.message || "Não foi possível criar a sessão.");
    }

    setSessionId(data.id);
    return data.id;
  };

  const saveGeneral = async () => {
    setSavingGeneral(true);
    setSavedGeneral(false);
    setGeneralError(null);

    try {
      const id = await ensureSession();
      const { error } = await supabase
        .from("session")
        .update({
          type: sessionType,
          clinician: clinician.trim() || null,
          clinician_id: clinicianId,
          date: sessionDate || undefined
        })
        .eq("id", id);

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
    const id = await ensureSession();
    const { error } = await supabase
      .from("session")
      .update({
        [key]: finalText,
        [`${key}_transcript`]: transcript,
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  };

  const finish = async () => {
    setFinishing(true);
    await ensureSession();
    success("Guardado com sucesso");
    setFinishing(false);
    router.push(`/episodes/${params.episodeId}`);
  };

  return (
    <>
      <AuthHeader />
      <main className="container-page space-y-4">
        <div>
          <Link className="link-brand-muted" href={`/episodes/${params.episodeId}`}>← Voltar</Link>
        </div>
        <h1 className="text-2xl font-semibold">Registo de Sessão Clínica</h1>

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

        <div className="flex justify-end pb-6 pt-2">
          <button className="btn-brand-primary px-8 py-3 text-lg" disabled={finishing} onClick={finish} type="button">
            {finishing ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" />A guardar...</span> : "Concluir sessão"}
          </button>
        </div>
      </main>
    </>
  );
}

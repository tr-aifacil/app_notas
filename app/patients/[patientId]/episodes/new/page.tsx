"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import AuthHeader from "@/components/AuthHeader";
import { useToast } from "@/components/ToastProvider";
import { buildAnalyticsLabel, isRecoveryAnalyticsIncluded, prettyLabel } from "@/lib/episodes/analytics";
import {
  BODY_REGION_OPTIONS,
  CASE_TYPE_OPTIONS,
  CONDITION_CHRONICITY_OPTIONS,
  CONDITION_TYPE_OPTIONS,
  LATERALITY_OPTIONS,
  getClassificationLabel,
  hasClassificationOption,
} from "@/lib/episodes/classification";

export default function NewEpisodePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ patientId: string }>();
  const { success, error: toastError } = useToast();
  const [title, setTitle] = useState("");
  const [profession, setProfession] = useState("fisioterapia");
  const [area, setArea] = useState("musculo-esqueletica");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [bodyRegion, setBodyRegion] = useState("");
  const [conditionType, setConditionType] = useState("");
  const [conditionChronicity, setConditionChronicity] = useState("");
  const [caseType, setCaseType] = useState("");
  const [laterality, setLaterality] = useState("");
  const [creatingEpisode, setCreatingEpisode] = useState(false);

  const analyticsLabel = useMemo(
    () => buildAnalyticsLabel({ bodyRegion, conditionType, conditionChronicity }),
    [bodyRegion, conditionType, conditionChronicity]
  );
  const analyticsIncluded = isRecoveryAnalyticsIncluded(caseType);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEpisode(true);

    const { data, error } = await supabase
      .from("episode_of_care")
      .insert({
        patient_id: params.patientId,
        title: title.trim(),
        profession,
        area,
        start_date: startDate,
        status: "ativo",
        body_region: bodyRegion,
        condition_type: conditionType,
        condition_chronicity: conditionChronicity.trim() || null,
        case_type: caseType,
        laterality: laterality.trim() || null,
        analytics_label: analyticsLabel,
        analytics_included: analyticsIncluded,
      })
      .select("*")
      .single();

    setCreatingEpisode(false);
    if (error || !data) {
      toastError("Erro ao guardar");
      return;
    }
    success("Guardado com sucesso");
    router.push(`/episodes/${data.id}`);
  };

  return (
    <>
      <AuthHeader />
      <main className="container-page max-w-xl">
        <div className="mb-2">
          <Link className="link-brand-muted" href={`/patients/${params.patientId}`}>← Voltar</Link>
        </div>
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <BackButton fallbackHref={`/patients/${params.patientId}`} />
            <h1 className="text-xl font-semibold">Novo Episódio</h1>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="label">Título do episódio</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <p className="text-xs text-slate-500">Título clínico legível para a equipa.</p>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <h2 className="mb-2 text-sm font-semibold text-slate-800">Classificação para métricas</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="label">Região / zona</label>
                  <select className="input" value={bodyRegion} onChange={(e) => setBodyRegion(e.target.value)} required>
                    <option value="">Selecionar</option>
                    {BODY_REGION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                    {!!bodyRegion && !hasClassificationOption(BODY_REGION_OPTIONS, bodyRegion) && (
                      <option value={bodyRegion}>{getClassificationLabel("body_region", bodyRegion, prettyLabel)} (valor atual)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="label">Tipologia da condição</label>
                  <select className="input" value={conditionType} onChange={(e) => setConditionType(e.target.value)} required>
                    <option value="">Selecionar</option>
                    {CONDITION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                    {!!conditionType && !hasClassificationOption(CONDITION_TYPE_OPTIONS, conditionType) && (
                      <option value={conditionType}>{getClassificationLabel("condition_type", conditionType, prettyLabel)} (valor atual)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="label">Cronologia</label>
                  <select className="input" value={conditionChronicity} onChange={(e) => setConditionChronicity(e.target.value)}>
                    <option value="">Selecionar</option>
                    {CONDITION_CHRONICITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Tipo de caso</label>
                  <select className="input" value={caseType} onChange={(e) => setCaseType(e.target.value)} required>
                    <option value="">Selecionar</option>
                    {CASE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Lado</label>
                  <select className="input" value={laterality} onChange={(e) => setLaterality(e.target.value)}>
                    <option value="">Selecionar</option>
                    {LATERALITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700">Resumo analítico: {prettyLabel(bodyRegion)} · {prettyLabel(conditionType)} · {prettyLabel(conditionChronicity)} · {prettyLabel(caseType)}</p>
              <p className="text-sm text-slate-700">Conta para métricas de recuperação: {analyticsIncluded ? "Sim" : "Não"}</p>
            </div>

            <div><label className="label">Profissão</label><input className="input" value={profession} onChange={(e) => setProfession(e.target.value)} required /></div>
            <div><label className="label">Área</label><input className="input" value={area} onChange={(e) => setArea(e.target.value)} required /></div>
            <div><label className="label">Data início</label><input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
            <button className="btn-brand-primary" disabled={creatingEpisode} type="submit">
              {creatingEpisode ? "A guardar..." : "Criar episódio"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

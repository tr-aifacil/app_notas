"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

export default function EpisodeMetadataEditor({
  episodeId,
  initialTitle,
  initialBodyRegion,
  initialConditionType,
  initialConditionChronicity,
  initialCaseType,
  initialLaterality,
}: {
  episodeId: string;
  initialTitle: string;
  initialBodyRegion: string | null;
  initialConditionType: string | null;
  initialConditionChronicity: string | null;
  initialCaseType: string | null;
  initialLaterality: string | null;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(initialTitle);
  const [bodyRegion, setBodyRegion] = useState(initialBodyRegion ?? "");
  const [conditionType, setConditionType] = useState(initialConditionType ?? "");
  const [conditionChronicity, setConditionChronicity] = useState(initialConditionChronicity ?? "");
  const [caseType, setCaseType] = useState(initialCaseType ?? "");
  const [laterality, setLaterality] = useState(initialLaterality ?? "");
  const [saving, setSaving] = useState(false);

  const analyticsLabel = useMemo(
    () => buildAnalyticsLabel({ bodyRegion, conditionType, conditionChronicity }),
    [bodyRegion, conditionType, conditionChronicity]
  );
  const analyticsIncluded = isRecoveryAnalyticsIncluded(caseType);

  const save = async () => {
    setSaving(true);
    await supabase
      .from("episode_of_care")
      .update({
        title: title.trim(),
        body_region: bodyRegion,
        condition_type: conditionType,
        condition_chronicity: conditionChronicity.trim() || null,
        case_type: caseType,
        laterality: laterality.trim() || null,
        analytics_label: analyticsLabel,
        analytics_included: analyticsIncluded,
      })
      .eq("id", episodeId);
    setSaving(false);
  };

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="label">Título do episódio</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
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
      <div>
        <button className="btn-brand-primary" type="button" onClick={save} disabled={saving || !title.trim() || !bodyRegion.trim() || !conditionType.trim() || !caseType.trim()}>{saving ? "A guardar..." : "Guardar metadados"}</button>
      </div>
    </div>
  );
}

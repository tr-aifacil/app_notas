"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildAnalyticsLabel, isRecoveryAnalyticsIncluded, prettyLabel } from "@/lib/episodes/analytics";

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
        body_region: bodyRegion.trim(),
        condition_type: conditionType.trim(),
        condition_chronicity: conditionChronicity.trim() || null,
        case_type: caseType.trim(),
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
          <div><label className="label">Região / zona</label><input className="input" value={bodyRegion} onChange={(e) => setBodyRegion(e.target.value)} required /></div>
          <div><label className="label">Tipologia da condição</label><input className="input" value={conditionType} onChange={(e) => setConditionType(e.target.value)} required /></div>
          <div>
            <label className="label">Cronologia</label>
            <select className="input" value={conditionChronicity} onChange={(e) => setConditionChronicity(e.target.value)}>
              <option value="">Selecionar</option>
              <option value="agudo">Agudo</option>
              <option value="subagudo">Subagudo</option>
              <option value="cronico">Crónico</option>
            </select>
          </div>
          <div>
            <label className="label">Tipo de caso</label>
            <select className="input" value={caseType} onChange={(e) => setCaseType(e.target.value)} required>
              <option value="">Selecionar</option>
              <option value="novo_caso">Novo caso</option>
              <option value="recorrencia">Recorrência</option>
              <option value="flare_up">Flare-up</option>
              <option value="manutencao">Manutenção</option>
              <option value="pos_operatorio">Pós-operatório</option>
            </select>
          </div>
          <div>
            <label className="label">Lado</label>
            <select className="input" value={laterality} onChange={(e) => setLaterality(e.target.value)}>
              <option value="">Selecionar</option>
              <option value="direito">Direito</option>
              <option value="esquerdo">Esquerdo</option>
              <option value="bilateral">Bilateral</option>
              <option value="nao_aplicavel">Não aplicável</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">Resumo analítico: {prettyLabel(bodyRegion)} · {prettyLabel(conditionType)} · {prettyLabel(conditionChronicity)} · {prettyLabel(caseType)}</p>
        <p className="text-sm text-slate-700">Conta para métricas de recuperação: {analyticsIncluded ? "Sim" : "Não"}</p>
      </div>
      <div>
        <button className="btn-secondary" type="button" onClick={save} disabled={saving || !title.trim() || !bodyRegion.trim() || !conditionType.trim() || !caseType.trim()}>{saving ? "A guardar..." : "Guardar metadados"}</button>
      </div>
    </div>
  );
}

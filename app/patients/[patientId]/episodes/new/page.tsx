"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import AuthHeader from "@/components/AuthHeader";
import { buildAnalyticsLabel, isRecoveryAnalyticsIncluded, prettyLabel } from "@/lib/episodes/analytics";

export default function NewEpisodePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ patientId: string }>();
  const [title, setTitle] = useState("");
  const [profession, setProfession] = useState("fisioterapia");
  const [area, setArea] = useState("musculo-esqueletica");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [bodyRegion, setBodyRegion] = useState("");
  const [conditionType, setConditionType] = useState("");
  const [conditionChronicity, setConditionChronicity] = useState("");
  const [caseType, setCaseType] = useState("");
  const [laterality, setLaterality] = useState("");

  const analyticsLabel = useMemo(
    () => buildAnalyticsLabel({ bodyRegion, conditionType, conditionChronicity }),
    [bodyRegion, conditionType, conditionChronicity]
  );
  const analyticsIncluded = isRecoveryAnalyticsIncluded(caseType);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("episode_of_care")
      .insert({
        patient_id: params.patientId,
        title: title.trim(),
        profession,
        area,
        start_date: startDate,
        status: "ativo",
        body_region: bodyRegion.trim(),
        condition_type: conditionType.trim(),
        condition_chronicity: conditionChronicity.trim() || null,
        case_type: caseType.trim(),
        laterality: laterality.trim() || null,
        analytics_label: analyticsLabel,
        analytics_included: analyticsIncluded,
      })
      .select("*")
      .single();

    if (!error && data) router.push(`/episodes/${data.id}`);
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

            <div><label className="label">Profissão</label><input className="input" value={profession} onChange={(e) => setProfession(e.target.value)} required /></div>
            <div><label className="label">Área</label><input className="input" value={area} onChange={(e) => setArea(e.target.value)} required /></div>
            <div><label className="label">Data início</label><input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
            <button className="btn-brand-primary" type="submit">Criar episódio</button>
          </form>
        </div>
      </main>
    </>
  );
}

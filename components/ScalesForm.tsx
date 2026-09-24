"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Spinner from "@/components/Spinner";
import { KOOS_SUBSCALES, SCALE_LABELS, scaleFormat, scoreUnit, validateScale, type KoosSubscale, type ScaleType } from "@/lib/scales/definitions";

export default function ScalesForm({ episodeId, sessionId }: { episodeId: string; sessionId?: string }) {
  const supabase = createClient();
  const { success, error: toastError } = useToast();
  const [type, setType] = useState<ScaleType>("END");
  const [ndiFormat, setNdiFormat] = useState<"points_50" | "percent_100">("points_50");
  const [koosSubscale, setKoosSubscale] = useState<KoosSubscale | "">("");
  const [value, setValue] = useState("");
  const [appliedAt, setAppliedAt] = useState(new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(value);
    const format = scaleFormat(type, ndiFormat);
    const validationError = validateScale(type, format, num, koosSubscale);
    if (validationError) return setMsg(validationError);
    setSaving(true);
    const { error: insertError } = await supabase.from("scale_result").insert({
      episode_id: episodeId,
      session_id: sessionId ?? null,
      type,
      value: num,
      applied_at: appliedAt,
      score_format: format,
      koos_subscale: type === "KOOS" ? koosSubscale : null
    });
    setSaving(false);
    if (insertError) {
      setMsg("Não foi possível guardar a escala. Confirma o formato e tenta novamente.");
      toastError("Erro ao guardar a escala");
      return;
    }

    success("Guardado com sucesso");
    setMsg("Escala registada.");
    setValue("");
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h3 className="text-lg font-semibold">Inserir Escala</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="label" htmlFor="scale-type">Instrumento</label>
          <select id="scale-type" className="input" value={type} onChange={(e) => { setType(e.target.value as ScaleType); setKoosSubscale(""); setMsg(""); }}>
            {Object.entries(SCALE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        {type === "KOOS" && (
          <div>
            <label className="label" htmlFor="koos-subscale">Subescala KOOS</label>
            <select id="koos-subscale" className="input" value={koosSubscale} onChange={(e) => setKoosSubscale(e.target.value as KoosSubscale)} required>
              <option value="">Selecionar</option>
              {Object.entries(KOOS_SUBSCALES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        )}
        {type === "NDI" && (
          <div>
            <label className="label" htmlFor="ndi-format">Formato NDI</label>
            <select id="ndi-format" className="input" value={ndiFormat} onChange={(e) => setNdiFormat(e.target.value as typeof ndiFormat)}>
              <option value="points_50">Pontos (0–50)</option>
              <option value="percent_100">Percentagem (0–100%)</option>
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="scale-value">Valor {scoreUnit(scaleFormat(type, ndiFormat))}</label>
          <input id="scale-value" className="input" type="number" min="0" max={type === "END" ? 10 : type === "RolandMorris" ? 24 : type === "NDI" && ndiFormat === "points_50" ? 50 : 100}
            step={type === "RolandMorris" || type === "NDI" && ndiFormat === "points_50" ? "1" : "any"}
            value={value} onChange={(e) => { setValue(e.target.value); setMsg(""); }} required />
        </div>
        <div>
          <label className="label" htmlFor="scale-date">Data de aplicação</label>
          <input id="scale-date" className="input" type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} required />
        </div>
      </div>
      {type === "KOOS" && <p className="text-xs text-brand-muted">KOOS: 100 pontos corresponde a menos problemas. Regista cada subescala separadamente.</p>}
      {(type === "DASH" || type === "QuickDASH") && <p className="text-xs text-brand-muted">0 pontos corresponde a menor incapacidade. Introduz a pontuação já calculada do instrumento selecionado.</p>}
      {type === "NDI" && <p className="text-xs text-brand-muted">Escolhe se o resultado foi calculado em pontos ou percentagem; a app não converte entre os formatos.</p>}
      <button className="btn-brand-primary" disabled={saving} type="submit">
        {saving ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" />A guardar...</span> : "Guardar escala"}
      </button>
      {msg && <p className="text-sm" role="status">{msg}</p>}
    </form>
  );
}

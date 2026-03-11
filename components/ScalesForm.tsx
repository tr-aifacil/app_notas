"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ScalesForm({ episodeId, sessionId }: { episodeId: string; sessionId?: string }) {
  const supabase = createClient();
  const [type, setType] = useState("END");
  const [value, setValue] = useState("");
  const [appliedAt, setAppliedAt] = useState(new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(value);
    if (Number.isNaN(num)) return setMsg("Valor inválido.");
    if (type === "END" && (num < 0 || num > 10)) return setMsg("END deve estar entre 0 e 10.");

    await supabase.from("scale_result").insert({
      episode_id: episodeId,
      session_id: sessionId ?? null,
      type: type as "END" | "DASH" | "KOOS" | "RolandMorris" | "NDI",
      value: num,
      applied_at: appliedAt
    });

    await fetch("/api/alerts/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episode_id: episodeId, session_id: sessionId ?? null })
    });

    setMsg("Escala registada.");
    setValue("");
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h3 className="text-lg font-semibold">Inserir Escala</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option>END</option><option>DASH</option><option>KOOS</option><option>RolandMorris</option><option>NDI</option>
        </select>
        <input className="input" type="number" value={value} onChange={(e) => setValue(e.target.value)} required />
        <input className="input" type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} required />
      </div>
      <button className="btn-brand-primary" type="submit">Guardar escala</button>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}

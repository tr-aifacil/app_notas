"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import AuthHeader from "@/components/AuthHeader";

export default function NewEpisodePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ patientId: string }>();
  const [title, setTitle] = useState("");
  const [profession, setProfession] = useState("fisioterapia");
  const [area, setArea] = useState("musculo-esqueletica");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [episodeLabel, setEpisodeLabel] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("episode_of_care")
      .insert({
        patient_id: params.patientId,
        title,
        profession,
        area,
        start_date: startDate,
        status: "ativo",
        episode_label: episodeLabel.trim() || null
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
          <div>
            <label className="label">Episode label (analytics)</label>
            <input className="input" value={episodeLabel} onChange={(e) => setEpisodeLabel(e.target.value)} placeholder="Ex: Lombalgia mecânica aguda" />
            <p className="text-xs text-slate-500">Label normalizada para coortes e métricas.</p>
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

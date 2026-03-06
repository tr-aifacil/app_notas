"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";

export default function NewEpisodePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ patientId: string }>();
  const [profession, setProfession] = useState("fisioterapia");
  const [area, setArea] = useState("musculo-esqueletica");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("episode_of_care")
      .insert({
        patient_id: params.patientId,
        profession,
        area,
        start_date: startDate,
        status: "ativo"
      })
      .select("*")
      .single();

    if (!error && data) router.push(`/episodes/${data.id}`);
  };

  return (
    <main className="container-page max-w-xl">
      <div className="mb-2">
        <Link className="text-sm text-slate-500 hover:text-slate-700" href={`/patients/${params.patientId}`}>← Voltar</Link>
      </div>
      <div className="card">
        <h1 className="mb-4 text-xl font-semibold">Novo Episódio</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div><label className="label">Profissão</label><input className="input" value={profession} onChange={(e) => setProfession(e.target.value)} required /></div>
          <div><label className="label">Área</label><input className="input" value={area} onChange={(e) => setArea(e.target.value)} required /></div>
          <div><label className="label">Data início</label><input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
          <button className="btn-primary" type="submit">Criar episódio</button>
        </form>
      </div>
    </main>
  );
}

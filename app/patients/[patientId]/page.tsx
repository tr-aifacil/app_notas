import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function PatientDetail({ params }: { params: { patientId: string } }) {
  const supabase = createServerSupabase();
  const { data: patient } = await supabase.from("patient").select("*").eq("id", params.patientId).single();
  const { data: episodes } = await supabase
    .from("episode_of_care")
    .select("*")
    .eq("patient_id", params.patientId)
    .order("start_date", { ascending: false });

  return (
    <main className="container-page">
      <div className="mb-2">
        <Link className="text-sm text-slate-500 hover:text-slate-700" href="/patients">← Voltar</Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Paciente: {patient?.internal_code}</h1>
        <Link className="btn-primary" href={`/patients/${params.patientId}/episodes/new`}>Novo episódio</Link>
      </div>

      <div className="card">
        <ul className="space-y-2">
          {(episodes || []).map((e) => (
            <li key={e.id} className="flex items-center justify-between border-b pb-2">
              <span>{e.profession} / {e.area} — {e.status}</span>
              <Link className="text-blue-600 hover:underline" href={`/episodes/${e.id}`}>Abrir</Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

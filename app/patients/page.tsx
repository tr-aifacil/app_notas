"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Patient = { id: string; internal_code: string };

export default function PatientsPage() {
  const supabase = createClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [internalCode, setInternalCode] = useState("");

  const load = async () => {
    const { data } = await supabase.from("patient").select("*").order("created_at", { ascending: false });
    setPatients(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalCode.trim()) return;
    await supabase.from("patient").insert({ internal_code: internalCode.trim() });
    setInternalCode("");
    load();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = "/login";
  };

  return (
    <main className="container-page">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </div>

      <div className="card mb-4">
        <form onSubmit={createPatient} className="flex gap-2">
          <input className="input" placeholder="Código interno (ex: PT-0001)" value={internalCode} onChange={(e) => setInternalCode(e.target.value)} required />
          <button className="btn-primary" type="submit">Criar</button>
        </form>
      </div>

      <div className="card">
        <ul className="space-y-2">
          {patients.map((p) => (
            <li key={p.id} className="flex items-center justify-between border-b pb-2">
              <span>{p.internal_code}</span>
              <Link className="text-blue-600 hover:underline" href={`/patients/${p.id}`}>Ver detalhe</Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthHeader from "@/components/AuthHeader";

type Patient = { id: string; internal_code: string; name: string };
type Clinician = { id: string; display_name: string };

export default function PatientsPage() {
  const supabase = createClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [selectedClinicianId, setSelectedClinicianId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [internalCode, setInternalCode] = useState("");

  const loadClinicians = useCallback(async () => {
    const { data } = await supabase
      .from("profile")
      .select("id, display_name")
      .eq("role", "clinician")
      .order("display_name", { ascending: true });

    setClinicians(data || []);
  }, [supabase]);

  const loadPatients = useCallback(async () => {
    if (!selectedClinicianId) {
      const { data } = await supabase
        .from("patient")
        .select("id, name, internal_code")
        .order("created_at", { ascending: false });

      setPatients(data || []);
      return;
    }

    const { data: sessions } = await supabase
      .from("session")
      .select("episode_of_care!inner(patient_id)")
      .eq("clinician_id", selectedClinicianId);

    const patientIds = Array.from(
      new Set(
        ((sessions as Array<{ episode_of_care: { patient_id: string } | { patient_id: string }[] | null }> | null) || [])
          .map((session) => {
            if (!session.episode_of_care) return null;
            return Array.isArray(session.episode_of_care)
              ? session.episode_of_care[0]?.patient_id
              : session.episode_of_care.patient_id;
          })
          .filter((id): id is string => Boolean(id))
      )
    );

    if (patientIds.length === 0) {
      setPatients([]);
      return;
    }

    const { data: filteredPatients } = await supabase
      .from("patient")
      .select("id, name, internal_code")
      .in("id", patientIds)
      .order("created_at", { ascending: false });

    setPatients(filteredPatients || []);
  }, [selectedClinicianId, supabase]);

  useEffect(() => {
    loadClinicians();
  }, [loadClinicians]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return patients;

    return patients.filter((patient) =>
      `${patient.name} ${patient.internal_code}`.toLowerCase().includes(normalized)
    );
  }, [patients, search]);

  const createPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !internalCode.trim()) return;
    await supabase.from("patient").insert({ name: name.trim(), internal_code: internalCode.trim() });
    setName("");
    setInternalCode("");
    loadPatients();
  };


  return (
    <main className="container-page space-y-4">
      <AuthHeader title="Pacientes" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <section className="card h-fit">
          <h2 className="mb-3 text-lg font-semibold">Criar paciente</h2>
          <form onSubmit={createPatient} className="space-y-3">
            <div>
              <label className="label">Nome interno</label>
              <input className="input" placeholder="Ex: Ana Silva" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Código interno</label>
              <input className="input" placeholder="Ex: PT-0001" value={internalCode} onChange={(e) => setInternalCode(e.target.value)} required />
            </div>
            <button className="btn-primary w-full" type="submit">Criar paciente</button>
          </form>
        </section>

        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <h2 className="text-lg font-semibold">Lista de pacientes</h2>
            <span className="text-sm text-slate-600">{filteredPatients.length} registos</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label">Pesquisar</label>
              <input
                className="input"
                placeholder="Nome ou código"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fisioterapeuta</label>
              <select
                className="input"
                value={selectedClinicianId}
                onChange={(e) => setSelectedClinicianId(e.target.value)}
              >
                <option value="">Todos</option>
                {clinicians.map((clinician) => (
                  <option key={clinician.id} value={clinician.id}>
                    {clinician.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ul className="space-y-2">
            {filteredPatients.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <span className="text-sm font-medium text-slate-800">{p.name} <span className="font-normal text-slate-500">({p.internal_code})</span></span>
                <Link className="btn-secondary px-3 py-1.5 text-xs" href={`/patients/${p.id}`}>Detalhes</Link>
              </li>
            ))}
            {filteredPatients.length === 0 && <li className="text-sm text-slate-500">Sem pacientes para os filtros selecionados.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}

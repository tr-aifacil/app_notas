"use client";

import { useCallback, useEffect, useState } from "react";
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
        (sessions || [])
          .map((session) => session.episode_of_care?.patient_id)
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

  const createPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !internalCode.trim()) return;
    await supabase.from("patient").insert({ name: name.trim(), internal_code: internalCode.trim() });
    setName("");
    setInternalCode("");
    loadPatients();
  };


  return (
    <><AuthHeader />
    <main className="container-page">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-primary">Pacientes</h1>
      </div>

      <div className="card mb-4">
        <form onSubmit={createPatient} className="flex gap-2">
          <input className="input" placeholder="Nome interno" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" placeholder="Código interno (ex: PT-0001)" value={internalCode} onChange={(e) => setInternalCode(e.target.value)} required />
          <button className="btn-brand-primary" type="submit">Criar</button>
        </form>
      </div>

      <div className="card mb-4">
        <div className="max-w-md">
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

      <div className="card">
        <ul className="space-y-2">
          {patients.map((p) => (
            <li key={p.id} className="flex items-center justify-between border-b pb-2">
              <span>{p.name} <span className="text-sm text-brand-muted">({p.internal_code})</span></span>
              <Link className="link-brand" href={`/patients/${p.id}`}>Ver detalhe</Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
    </>
  );
}

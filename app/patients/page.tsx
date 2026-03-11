"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Patient = { id: string; internal_code: string; name: string };
type Clinician = { id: string; display_name: string };
type Scope = "all" | "mine";

export default function PatientsPage() {
  const supabase = createClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [selectedScope, setSelectedScope] = useState<Scope>("all");
  const [selectedClinicianId, setSelectedClinicianId] = useState<string>("");
  const [loggedClinicianId, setLoggedClinicianId] = useState<string | null>(null);
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

  const loadAuthUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setLoggedClinicianId(data.user?.id || null);
  }, [supabase]);

  const loadPatients = useCallback(async () => {
    const activeClinicianId = selectedScope === "mine" ? loggedClinicianId : selectedClinicianId;

    if (!activeClinicianId) {
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
      .eq("clinician_id", activeClinicianId);

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
  }, [loggedClinicianId, selectedClinicianId, selectedScope, supabase]);

  useEffect(() => {
    loadClinicians();
    loadAuthUser();
  }, [loadAuthUser, loadClinicians]);

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

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = "/login";
  };

  const contextTitle = useMemo(() => {
    if (selectedScope === "mine") return "Meus Pacientes";
    if (!selectedClinicianId) return "Todos os Pacientes";
    return "Pacientes do clínico selecionado";
  }, [selectedClinicianId, selectedScope]);

  return (
    <main className="container-page">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </div>

      <div className="card mb-4">
        <form onSubmit={createPatient} className="flex gap-2">
          <input className="input" placeholder="Nome interno" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" placeholder="Código interno (ex: PT-0001)" value={internalCode} onChange={(e) => setInternalCode(e.target.value)} required />
          <button className="btn-primary" type="submit">Criar</button>
        </form>
      </div>

      <div className="card mb-4 space-y-4">
        <div>
          <p className="label">Escopo</p>
          <div className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSelectedScope("all")}
              className={`rounded px-3 py-1 text-sm ${selectedScope === "all" ? "bg-white font-medium text-slate-900 shadow" : "text-slate-600"}`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedScope("mine")}
              className={`rounded px-3 py-1 text-sm ${selectedScope === "mine" ? "bg-white font-medium text-slate-900 shadow" : "text-slate-600"}`}
            >
              Meus Pacientes
            </button>
          </div>
        </div>

        <div className="max-w-md">
          <label className="label">Filtro avançado por clínico (opcional)</label>
          <select
            className="input"
            value={selectedClinicianId}
            onChange={(e) => {
              setSelectedScope("all");
              setSelectedClinicianId(e.target.value);
            }}
            disabled={selectedScope === "mine"}
          >
            <option value="">Todos</option>
            {clinicians.map((clinician) => (
              <option key={clinician.id} value={clinician.id}>
                {clinician.display_name}
              </option>
            ))}
          </select>
          {selectedScope === "mine" ? (
            <p className="mt-1 text-xs text-slate-500">No modo “Meus Pacientes”, o filtro avançado fica desativado.</p>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between border-b pb-2">
          <p className="text-sm text-slate-600">{contextTitle}</p>
          <p className="text-sm font-medium text-slate-700">{patients.length} paciente(s)</p>
        </div>

        {patients.length === 0 ? (
          <p className="text-sm text-slate-500">
            {selectedScope === "mine"
              ? "Nenhum paciente associado às suas sessões clínicas."
              : selectedClinicianId
                ? "Nenhum paciente encontrado para o clínico selecionado."
                : "Nenhum paciente registado."}
          </p>
        ) : (
          <ul className="space-y-2">
            {patients.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b pb-2">
                <span>{p.name} <span className="text-sm text-slate-500">({p.internal_code})</span></span>
                <Link className="text-blue-600 hover:underline" href={`/patients/${p.id}`}>Ver detalhe</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

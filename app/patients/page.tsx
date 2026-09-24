"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthHeader from "@/components/AuthHeader";
import { useToast } from "@/components/ToastProvider";

type Patient = { id: string; internal_code: string; name: string };
type Clinician = { id: string; display_name: string };

export default function PatientsPage() {
  const supabase = createClient();
  const { success, error: toastError } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [selectedClinicianId, setSelectedClinicianId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [internalCode, setInternalCode] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadClinicians = useCallback(async () => {
    const { data } = await supabase
      .from("profile")
      .select("id, display_name")
      .eq("role", "clinician")
      .order("display_name", { ascending: true });

    setClinicians(data || []);
  }, [supabase]);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    let patientIds: string[] | null = null;
    if (selectedClinicianId) {
      const { data: access, error: accessError } = await supabase
        .from("patient_access")
        .select("patient_id")
        .eq("clinician_id", selectedClinicianId);
      if (accessError) {
        setLoadError("Não foi possível carregar os utentes.");
        setLoading(false);
        return;
      }
      patientIds = (access || []).map((item) => item.patient_id);
      if (patientIds.length === 0) {
        setPatients([]);
        setTotal(0);
        setLoading(false);
        return;
      }
    }

    let query = supabase.from("patient").select("id, name, internal_code", { count: "exact" });
    if (patientIds) query = query.in("id", patientIds);
    // Escape PostgREST filter separators before building the OR expression.
    const term = search.trim().replace(/[(),.%_*\\]/g, "").slice(0, 80);
    if (term) query = query.or(`name.ilike.%${term}%,internal_code.ilike.%${term}%`);
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(page * 50, page * 50 + 49);
    if (error) setLoadError("Não foi possível carregar os utentes.");
    else {
      setPatients(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [page, search, selectedClinicianId, supabase]);

  useEffect(() => {
    loadClinicians();
  }, [loadClinicians]);

  useEffect(() => {
    const timer = window.setTimeout(loadPatients, 250);
    return () => window.clearTimeout(timer);
  }, [loadPatients]);

  const createPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !internalCode.trim()) return;
    setCreatingPatient(true);
    const { error } = await supabase.from("patient").insert({ name: name.trim(), internal_code: internalCode.trim() });
    setCreatingPatient(false);
    if (error) {
      toastError("Erro ao guardar");
      return;
    }
    success("Guardado com sucesso");
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
              <label className="label" htmlFor="patient-name">Nome interno</label>
              <input id="patient-name" className="input" placeholder="Ex: Ana Silva" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="patient-code">Código interno</label>
              <input id="patient-code" className="input" placeholder="Ex: PT-0001" value={internalCode} onChange={(e) => setInternalCode(e.target.value)} required />
            </div>
            <button className="btn-brand-primary w-full" disabled={creatingPatient} type="submit">
              {creatingPatient ? "A guardar..." : "Criar paciente"}
            </button>
          </form>
        </section>

        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <h2 className="text-lg font-semibold">Lista de pacientes</h2>
            <span className="text-sm text-slate-600">{total} registos</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="patient-search">Pesquisar</label>
              <input
                id="patient-search"
                className="input"
                placeholder="Nome ou código"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
            <div>
              <label className="label" htmlFor="patient-clinician">Fisioterapeuta</label>
              <select
                id="patient-clinician"
                className="input"
                value={selectedClinicianId}
                onChange={(e) => { setSelectedClinicianId(e.target.value); setPage(0); }}
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

          {loadError && <p className="text-sm text-state-error" role="alert">{loadError}</p>}
          {loading && <p className="text-sm text-slate-600">A carregar...</p>}
          <ul className="space-y-2">
            {patients.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <span className="text-sm font-medium text-slate-800">{p.name} <span className="font-normal text-slate-500">({p.internal_code})</span></span>
                <Link className="btn-brand-outline px-3 py-1.5 text-xs" href={`/patients/${p.id}`}>Detalhes</Link>
              </li>
            ))}
            {!loading && patients.length === 0 && <li className="text-sm text-slate-500">Sem pacientes para os filtros selecionados.</li>}
          </ul>
          {total > 50 && (
            <div className="flex items-center justify-between gap-2">
              <button className="btn-brand-secondary" disabled={page === 0 || loading} onClick={() => setPage(page - 1)} type="button">Anterior</button>
              <span className="text-sm text-slate-600">Página {page + 1} de {Math.ceil(total / 50)}</span>
              <button className="btn-brand-secondary" disabled={(page + 1) * 50 >= total || loading} onClick={() => setPage(page + 1)} type="button">Seguinte</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

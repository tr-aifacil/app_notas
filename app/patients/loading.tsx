import Spinner from "@/components/Spinner";

export default function PatientsLoading() {
  return (
    <main className="container-page">
      <div className="card flex items-center gap-3">
        <Spinner />
        <p className="text-sm text-brand-muted">A carregar pacientes...</p>
      </div>
    </main>
  );
}

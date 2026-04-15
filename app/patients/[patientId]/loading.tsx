import Spinner from "@/components/Spinner";

export default function PatientLoading() {
  return (
    <main className="container-page">
      <div className="card flex items-center gap-3">
        <Spinner />
        <p className="text-sm text-brand-muted">A carregar paciente...</p>
      </div>
    </main>
  );
}

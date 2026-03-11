import AuthHeader from "@/components/AuthHeader";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <>
      <AuthHeader />
      <main className="container-page space-y-4">
        <section className="card">
          <h1 className="text-2xl font-semibold">Admin Analytics</h1>
          <p className="text-sm text-slate-600">Métricas descritivas para episódios e sessões (fundação para previsão futura).</p>
        </section>
        <AdminDashboard />
      </main>
    </>
  );
}

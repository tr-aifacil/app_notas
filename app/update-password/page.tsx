"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // @supabase/ssr troca ?code= automaticamente (detectSessionInUrl: true)
    // Ouvir o evento PASSWORD_RECOVERY que é disparado após essa troca automática
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Verificar se a sessão já existe (troca pode ter corrido antes deste useEffect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        const hasCode = new URLSearchParams(window.location.search).has("code");
        const hasHash = window.location.hash.includes("access_token");
        if (!hasCode && !hasHash) {
          setError("Link inválido ou expirado. Pede um novo.");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("As passwords não coincidem.");
    if (password.length < 6) return setError("A password deve ter pelo menos 6 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/login");
  };

  return (
    <main className="container-page max-w-md">
      <div className="card">
        <h1 className="mb-4 text-xl font-semibold">Definir nova password</h1>
        {!ready && !error && (
          <p className="text-sm text-gray-500">A verificar link...</p>
        )}
        {ready && (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="label">Nova password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Confirmar password</label>
              <input
                className="input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? "A guardar..." : "Guardar password"}
            </button>
          </form>
        )}
        {error && (
          <>
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <p className="mt-3 text-sm text-center">
              <a href="/reset-password" className="text-blue-600 hover:underline">Pedir novo link</a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

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
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError("Link inválido ou expirado. Pede um novo.");
        else setReady(true);
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
        else setError("Link inválido ou expirado. Pede um novo.");
      });
    }
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
    router.push("/patients");
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

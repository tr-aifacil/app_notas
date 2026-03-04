"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/update-password",
    });
    setLoading(false);
    if (error) return setError(error.message);
    setMsg("Email enviado. Verifica a tua caixa de entrada.");
  };

  return (
    <main className="container-page max-w-md">
      <div className="card">
        <h1 className="mb-4 text-xl font-semibold">Recuperar password</h1>
        {msg ? (
          <p className="text-sm text-green-700">{msg}</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? "A enviar..." : "Enviar link de reset"}
            </button>
          </form>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-4 text-sm text-center">
          <a href="/login" className="text-blue-600 hover:underline">Voltar ao login</a>
        </p>
      </div>
    </main>
  );
}

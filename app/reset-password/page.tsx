"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPublicAppUrl } from "@/lib/env";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  const [requestLoading, setRequestLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");

  const appUrl = useMemo(() => getPublicAppUrl(), []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryFlow(true);
        setIsCheckingRecovery(false);
        setUpdateError("");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsRecoveryFlow(true);
        setIsCheckingRecovery(false);
        return;
      }

      const hasRecoveryParams =
        new URLSearchParams(window.location.search).has("code") ||
        window.location.hash.includes("access_token");

      if (hasRecoveryParams) {
        setUpdateError("Link inválido ou expirado. Pede um novo link de recuperação.");
      }

      setIsCheckingRecovery(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const onRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestMessage("");
    setRequestError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });

    setRequestLoading(false);

    if (error) {
      setRequestError(error.message);
      return;
    }

    setRequestMessage("Email enviado. Verifica a tua caixa de entrada.");
  };

  const onUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError("");
    setUpdateMessage("");

    if (password !== confirmPassword) {
      setUpdateError("As passwords não coincidem.");
      return;
    }

    if (password.length < 6) {
      setUpdateError("A password deve ter pelo menos 6 caracteres.");
      return;
    }

    setUpdateLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setUpdateLoading(false);

    if (error) {
      setUpdateError(error.message);
      return;
    }

    setUpdateMessage("Password atualizada com sucesso. A redirecionar para login...");
    setTimeout(() => router.push("/login"), 1200);
  };

  return (
    <main className="container-page max-w-md">
      <div className="card">
        <h1 className="mb-4 text-xl font-semibold">
          {isRecoveryFlow ? "Definir nova password" : "Recuperar password"}
        </h1>

        {isCheckingRecovery && (
          <p className="text-sm text-gray-500">A verificar link...</p>
        )}

        {!isCheckingRecovery && isRecoveryFlow && (
          <form onSubmit={onUpdatePassword} className="space-y-3">
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-brand-primary w-full" type="submit" disabled={updateLoading}>
              {updateLoading ? "A guardar..." : "Guardar password"}
            </button>
          </form>
        )}

        {!isCheckingRecovery && !isRecoveryFlow && (
          <>
            {requestMessage ? (
              <p className="text-sm text-green-700">{requestMessage}</p>
            ) : (
              <form onSubmit={onRequestReset} className="space-y-3">
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
                <button className="btn-brand-primary w-full" type="submit" disabled={requestLoading}>
                  {requestLoading ? "A enviar..." : "Enviar link de reset"}
                </button>
              </form>
            )}
          </>
        )}

        {requestError && <p className="mt-3 text-sm text-red-600">{requestError}</p>}
        {updateError && <p className="mt-3 text-sm text-red-600">{updateError}</p>}
        {updateMessage && <p className="mt-3 text-sm text-green-700">{updateMessage}</p>}

        <p className="mt-4 text-sm text-center">
          <a href="/login" className="text-blue-600 hover:underline">
            Voltar ao login
          </a>
        </p>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthHeader() {
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = "/login";
  };

  return (
    <header className="border-b border-brand-border bg-brand-surface/95">
      <div className="container-page flex items-center justify-between py-3">
        <Link href="/patients" className="text-lg font-semibold text-brand-primary">
          Espaço N Saúde
        </Link>
        <button onClick={logout} className="btn-brand-secondary" type="button">
          Terminar sessão
        </button>
      </div>
    </header>
  );
}

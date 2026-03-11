"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthHeader({ title }: { title?: string }) {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user?.id) return;

      const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
    };

    loadRole();
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = "/login";
  };

  return (
    <header className="border-b border-brand-border bg-brand-surface/95">
      <div className="container-page flex items-center justify-between py-3">
        <Link href="/patients" className="text-lg font-semibold text-brand-primary">
          {title || "Espaço N Saúde"}
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && <Link href="/admin" className="btn-brand-secondary">Admin</Link>}
          <button onClick={logout} className="btn-brand-secondary" type="button">
            Terminar sessão
          </button>
        </div>
      </div>
    </header>
  );
}

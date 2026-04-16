"use client";

import { useEffect } from "react";

export default function UpdatePasswordPage() {
  useEffect(() => {
    const target = `/reset-password${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }, []);

  return (
    <main className="container-page max-w-md">
      <div className="card">
        <h1 className="mb-4 text-xl font-semibold">Redirecionar...</h1>
        <p className="text-sm text-gray-500">A encaminhar para a página de redefinição de password.</p>
      </div>
    </main>
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";

type Alert = {
  id: string;
  message: string;
  rule_code: string;
  created_at: string;
  dismissed: boolean;
};

export default function AlertsPanel({ alerts, userName }: { alerts: Alert[]; userName: string }) {
  const supabase = createClient();

  const dismiss = async (id: string) => {
    await supabase
      .from("alert_log")
      .update({
        dismissed: true,
        dismissed_by: userName || "clinician",
        dismissed_at: new Date().toISOString()
      })
      .eq("id", id);
    location.reload();
  };

  return (
    <div className="card">
      <h3 className="mb-3 text-lg font-semibold">Alertas</h3>
      <ul className="space-y-2">
        {alerts.map((a) => (
          <li key={a.id} className="rounded border p-2">
            <p className="text-sm font-medium">{a.rule_code}</p>
            <p className="text-sm">{a.message}</p>
            <p className="text-xs text-brand-muted">{new Date(a.created_at).toLocaleString("pt-PT")}</p>
            {!a.dismissed && (
              <button className="btn-brand-secondary mt-2" onClick={() => dismiss(a.id)}>Ignorar</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

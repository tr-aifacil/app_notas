"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDatePT } from "@/lib/utils/formatDate";
import { useToast } from "@/components/ToastProvider";

type Reminder = {
  id: string;
  title: string;
  message: string;
  due_date: string | null;
  created_at: string;
  dismissed: boolean;
};

const normalizeDueDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const ptMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ptMatch) {
    const [, day, month, year] = ptMatch;
    return `${year}-${month}-${day}`;
  }

  return null;
};

export default function RemindersPanel({
  reminders,
  episodeId,
  userId,
  canCreate
}: {
  reminders: Reminder[];
  episodeId: string;
  userId: string | null;
  canCreate: boolean;
}) {
  const supabase = createClient();
  const { success, error: toastError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyReminderId, setBusyReminderId] = useState<string | null>(null);
  const [items, setItems] = useState<Reminder[]>(reminders);

  const createReminder = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toastError("O título é obrigatório.");
      return;
    }

    const parsedDueDate = normalizeDueDate(dueDate);
    if (dueDate.trim() && !parsedDueDate) {
      toastError("A data limite é inválida. Use AAAA-MM-DD.");
      return;
    }

    setSaving(true);

    const payload = {
      episode_id: episodeId,
      title: cleanTitle,
      message: message.trim(),
      due_date: parsedDueDate,
      rule_code: "MANUAL",
      created_by: userId,
      dismissed: false
    };

    const { data: insertedReminder, error: insertError } = await supabase
      .from("alert_log")
      .insert(payload)
      .select("id, title, message, due_date, created_at, dismissed")
      .single();

    setSaving(false);

    if (insertError) {
      console.error("[reminders] failed to save reminder", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        episodeId,
        hasDueDate: Boolean(parsedDueDate)
      });
      toastError(`Não foi possível guardar o lembrete: ${insertError.message}`);
      return;
    }

    if (insertedReminder) {
      setItems((prev) => [insertedReminder, ...prev]);
    }
    success("Lembrete guardado com sucesso.");
    setIsOpen(false);
    setTitle("");
    setDueDate("");
    setMessage("");
  };

  const dismiss = async (id: string) => {
    setBusyReminderId(id);
    const { error: updateError } = await supabase
      .from("alert_log")
      .update({
        dismissed: true,
        dismissed_by: userId,
        dismissed_at: new Date().toISOString()
      })
      .eq("id", id);

    setBusyReminderId(null);

    if (updateError) {
      console.error("[reminders] failed to dismiss reminder", {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        reminderId: id
      });
      toastError(`Não foi possível atualizar o lembrete: ${updateError.message}`);
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, dismissed: true } : item)));
    success("Lembrete concluído com sucesso.");
  };

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Lembretes</h3>
        <button className="btn-brand-primary" disabled={!canCreate} onClick={() => setIsOpen(true)} type="button">
          Novo lembrete
        </button>
      </div>
      {!canCreate && (
        <p className="mb-3 text-sm text-slate-600">Episódio em alta. Não é possível criar lembretes.</p>
      )}

      {isOpen && canCreate && (
        <form className="mb-4 space-y-2 rounded-md border p-3" onSubmit={createReminder}>
          <div>
            <label className="label">Título</label>
            <input className="input" onChange={(e) => setTitle(e.target.value)} required value={title} />
          </div>
          <div>
            <label className="label">Data limite</label>
            <input className="input" onChange={(e) => setDueDate(e.target.value)} type="date" value={dueDate} />
          </div>
          <div>
            <label className="label">Nota</label>
            <textarea className="input min-h-20" onChange={(e) => setMessage(e.target.value)} value={message} />
          </div>
          <div className="flex gap-2">
            <button className="btn-brand-primary" disabled={saving} type="submit">
              {saving ? "A guardar..." : "Guardar"}
            </button>
            <button className="btn-brand-secondary" onClick={() => setIsOpen(false)} type="button">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {items.map((reminder) => (
          <li key={reminder.id} className="rounded border p-2">
            <p className="text-sm font-medium">{reminder.title}</p>
            {reminder.due_date && <p className="text-xs text-brand-muted">Prazo: {formatDatePT(reminder.due_date)}</p>}
            {reminder.message && <p className="text-sm">{reminder.message}</p>}
            <p className="text-xs text-brand-muted">
              Criado em: {formatDatePT(reminder.created_at)} • Estado: {reminder.dismissed ? "Concluído" : "Pendente"}
            </p>
            {!reminder.dismissed && (
              <button
                className="btn-brand-secondary mt-2"
                disabled={busyReminderId === reminder.id}
                onClick={() => dismiss(reminder.id)}
                type="button"
              >
                {busyReminderId === reminder.id ? "A guardar..." : "Concluir"}
              </button>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-brand-muted">Sem lembretes registados.</li>}
      </ul>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";

type Props = {
  section: "subjective" | "objective" | "clinical_analysis" | "intervention" | "response" | "plan";
  title: string;
  description?: string;
  transcript: string;
  finalText: string;
  onChangeTranscript: (v: string) => void;
  onChangeFinalText: (v: string) => void;
  onSave?: (transcript: string, finalText: string) => Promise<void>;
};

function getBestMimeType(): string {
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

export default function SectionCard(props: Props) {
  const { success, error: toastError } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecord = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getBestMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro ao aceder ao microfone: ${msg}`);
    }
  };

  const stopRecordAndTranscribe = async () => {
    if (!mediaRecorderRef.current) return;
    setError(null);
    setBusy(true);

    try {
      const recorder = mediaRecorderRef.current;
      const mimeType = recorder.mimeType || "audio/webm";

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
        recorder.stream.getTracks().forEach((t) => t.stop());
      });

      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
      const file = new File([blob], `${props.section}.${ext}`, { type: mimeType });
      const form = new FormData();
      form.append("section", props.section);
      form.append("audio", file);

      const res = await fetch("/api/audio/transcribe", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Erro ao transcrever áudio.");
      } else {
        const transcript = json.transcript || "";
        props.onChangeTranscript(transcript);
        props.onChangeFinalText((props.finalText ? `${props.finalText}\n` : "") + transcript);
        setSaved(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro ao transcrever: ${msg}`);
    } finally {
      setIsRecording(false);
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-3">
      <h3 className="text-lg font-semibold">{props.title}</h3>
      {props.description && <p className="text-sm text-brand-muted">{props.description}</p>}
      <div className="flex gap-2">
        {!isRecording ? (
          <button className="btn-brand-secondary" onClick={startRecord} type="button" disabled={busy}>Gravar</button>
        ) : (
          <button className="btn-brand-secondary" onClick={stopRecordAndTranscribe} type="button" disabled={busy}>Parar</button>
        )}
      </div>
      {error && <p className="text-sm text-state-error">{error}</p>}

      <div>
        <label className="label">{props.title}</label>
        <textarea
          className="input min-h-40"
          value={props.finalText}
          onChange={(e) => {
            props.onChangeFinalText(e.target.value);
            props.onChangeTranscript(e.target.value);
            setSaved(false);
            setSaveError(null);
          }}
        />
      </div>

      {props.onSave && (
        <div className="flex items-center gap-3 pt-1">
          <button
            className="btn-brand-secondary"
            type="button"
            disabled={saving || busy}
            onClick={async () => {
              setSaving(true);
              setSaved(false);
              setSaveError(null);
              try {
                await props.onSave!(props.transcript, props.finalText);
                setSaved(true);
                success("Guardado com sucesso");
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Erro ao guardar secção.";
                setSaveError(msg);
                toastError("Erro ao guardar");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "A guardar..." : `Guardar ${props.title}`}
          </button>
          {saved && <span className="text-sm text-state-success">✓ Guardado</span>}
          {saveError && <span className="text-sm text-state-error">{saveError}</span>}
        </div>
      )}
    </div>
  );
}

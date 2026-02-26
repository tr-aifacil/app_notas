"use client";

import { useRef, useState } from "react";

type Props = {
  section: "subjective" | "objective" | "clinical_analysis" | "intervention" | "response" | "plan";
  title: string;
  transcript: string;
  finalText: string;
  onChangeTranscript: (v: string) => void;
  onChangeFinalText: (v: string) => void;
};

function formatJsonToText(obj: Record<string, string>) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v || ""}`)
    .join("\n");
}

export default function SectionCard(props: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecord = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (ev) => chunksRef.current.push(ev.data);
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecordAndTranscribe = async () => {
    if (!mediaRecorderRef.current) return;
    setBusy(true);

    const recorder = mediaRecorderRef.current;
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const file = new File([blob], `${props.section}.webm`, { type: "audio/webm" });
    const form = new FormData();
    form.append("section", props.section);
    form.append("audio", file);

    const res = await fetch("/api/audio/transcribe", { method: "POST", body: form });
    const json = await res.json();
    props.onChangeTranscript(json.transcript || "");
    setIsRecording(false);
    setBusy(false);
  };

  const organize = async () => {
    setBusy(true);
    const res = await fetch("/api/ai/organize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: props.section, transcricao: props.transcript })
    });
    const data = await res.json();
    props.onChangeFinalText(formatJsonToText(data.json || {}));
    setBusy(false);
  };

  return (
    <div className="card space-y-3">
      <h3 className="text-lg font-semibold">{props.title}</h3>
      <div className="flex gap-2">
        {!isRecording ? (
          <button className="btn-secondary" onClick={startRecord} type="button">Gravar</button>
        ) : (
          <button className="btn-secondary" onClick={stopRecordAndTranscribe} type="button">Parar</button>
        )}
        <button className="btn-primary" onClick={organize} type="button" disabled={busy}>Organizar com AI</button>
      </div>

      <div>
        <label className="label">Transcrição (editável)</label>
        <textarea className="input min-h-24" value={props.transcript} onChange={(e) => props.onChangeTranscript(e.target.value)} />
      </div>

      <div>
        <label className="label">Texto final (editável)</label>
        <textarea className="input min-h-40" value={props.finalText} onChange={(e) => props.onChangeFinalText(e.target.value)} />
      </div>
    </div>
  );
}

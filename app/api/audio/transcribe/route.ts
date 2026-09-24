import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRequiredEnv } from "@/lib/env";

export const runtime = "nodejs";
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set(["audio/webm", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-m4a"]);

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sessão expirada. Faz login novamente." }, { status: 401 });
    }

    const requestBytes = Number(req.headers.get("content-length"));
    if (requestBytes > MAX_AUDIO_BYTES + 1024 * 1024) {
      return NextResponse.json({ error: "Áudio demasiado grande. Grava um segmento mais curto." }, { status: 413 });
    }

    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File)) return NextResponse.json({ error: "Ficheiro de áudio em falta." }, { status: 400 });
    if (audio.size === 0) {
      return NextResponse.json({ error: "Áudio vazio — tenta gravar de novo." }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Áudio demasiado grande. Grava um segmento mais curto." }, { status: 413 });
    }
    if (!ALLOWED_AUDIO_TYPES.has(audio.type.split(";")[0].toLowerCase())) {
      return NextResponse.json({ error: "Formato de áudio não suportado." }, { status: 415 });
    }

    const client = new OpenAI({ apiKey: getRequiredEnv("OPENAI_API_KEY") });
    const transcript = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: audio
    });

    return NextResponse.json({ transcript: transcript.text || "" });
  } catch (err) {
    console.error("[transcribe] Falha ao processar áudio.");
    if (err instanceof Error && err.message.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada no servidor." }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro ao transcrever áudio. Tenta novamente." }, { status: 500 });
  }
}

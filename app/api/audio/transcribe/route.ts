import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRequiredEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sessão expirada. Faz login novamente." }, { status: 401 });
    }

    const form = await req.formData();
    const audio = form.get("audio") as File | null;
    if (!audio) return NextResponse.json({ error: "Ficheiro de áudio em falta." }, { status: 400 });
    if (audio.size === 0) {
      return NextResponse.json({ error: "Áudio vazio — tenta gravar de novo." }, { status: 400 });
    }

    console.log(`[transcribe] audio size: ${audio.size} bytes`);

    const client = new OpenAI({ apiKey: getRequiredEnv("OPENAI_API_KEY") });
    const transcript = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: audio
    });

    console.log("[transcribe] transcript:", transcript.text || "");

    return NextResponse.json({ transcript: transcript.text || "" });
  } catch (err) {
    console.error("[transcribe]", err);
    if (err instanceof Error && err.message.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada no servidor." }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro ao transcrever áudio. Tenta novamente." }, { status: 500 });
  }
}

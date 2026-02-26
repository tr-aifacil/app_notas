import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRequiredEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const form = await req.formData();
    const audio = form.get("audio") as File | null;
    if (!audio) return NextResponse.json({ error: "audio missing" }, { status: 400 });

    const client = new OpenAI({ apiKey: getRequiredEnv("OPENAI_API_KEY") });
    const transcript = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: audio
    });

    return NextResponse.json({ transcript: transcript.text || "" });
  } catch (err) {
    console.error("[transcribe]", err);
    return NextResponse.json({ error: "Erro ao transcrever áudio. Tenta novamente." }, { status: 500 });
  }
}

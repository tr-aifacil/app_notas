import { NextResponse } from "next/server";
import OpenAI from "openai";
import { organizePrompts } from "@/lib/ai/prompts";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRequiredEnv } from "@/lib/env";

export const runtime = "nodejs";
const MAX_TRANSCRIPT_CHARS = 12000;

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const { data: profile } = await supabase.from("profile").select("id").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "Conta sem acesso à app." }, { status: 403 });

    if (Number(req.headers.get("content-length")) > 32 * 1024) {
      return NextResponse.json({ error: "Texto demasiado longo." }, { status: 413 });
    }
    const { section, transcricao } = await req.json();
    const prompt = organizePrompts[section as keyof typeof organizePrompts];
    if (!prompt) return NextResponse.json({ error: "section inválida" }, { status: 400 });
    if (typeof transcricao !== "string" || !transcricao.trim() || transcricao.length > MAX_TRANSCRIPT_CHARS) {
      return NextResponse.json({ error: "A transcrição deve ter entre 1 e 12 000 caracteres." }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: getRequiredEnv("OPENAI_API_KEY") });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.userTemplate.replace("{{transcricao}}", transcricao) }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("[organize] Resposta inválida da IA.");
      return NextResponse.json({ error: "Resposta inválida da IA." }, { status: 500 });
    }
    return NextResponse.json({ json: parsed });
  } catch (err) {
    console.error("[organize] Falha ao organizar texto.");
    return NextResponse.json({ error: "Erro ao organizar texto. Tenta novamente." }, { status: 500 });
  }
}

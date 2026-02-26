import { NextResponse } from "next/server";
import OpenAI from "openai";
import { organizePrompts } from "@/lib/ai/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { section, transcricao } = await req.json();
    const prompt = organizePrompts[section as keyof typeof organizePrompts];
    if (!prompt) return NextResponse.json({ error: "section inválida" }, { status: 400 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.userTemplate.replace("{{transcricao}}", transcricao || "") }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return NextResponse.json({ json: parsed });
  } catch {
    return NextResponse.json({ json: {} }, { status: 500 });
  }
}

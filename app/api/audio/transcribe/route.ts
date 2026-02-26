import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio") as File | null;
    if (!audio) return NextResponse.json({ error: "audio missing" }, { status: 400 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const transcript = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: audio
    });

    return NextResponse.json({ transcript: transcript.text || "" });
  } catch {
    return NextResponse.json({ transcript: "" }, { status: 500 });
  }
}

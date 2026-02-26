import { NextResponse } from "next/server";
import { evaluateAlerts } from "@/lib/alerts/evaluateAlerts";

export async function POST(req: Request) {
  const { episode_id } = await req.json();
  if (!episode_id) return NextResponse.json({ error: "episode_id obrigatório" }, { status: 400 });
  await evaluateAlerts(episode_id);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { evaluateAlerts } from "@/lib/alerts/evaluateAlerts";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { episode_id } = await req.json();
  if (!episode_id) return NextResponse.json({ error: "episode_id obrigatório" }, { status: 400 });

  try {
    await evaluateAlerts(episode_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[alerts/evaluate]", err);
    return NextResponse.json({ error: "Erro ao avaliar alertas." }, { status: 500 });
  }
}

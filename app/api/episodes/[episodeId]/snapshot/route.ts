import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: { episodeId: string } }) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = serverSupabase;
  const episode_id = params.episodeId;
  const { data: episode, error } = await supabase.from("episode_of_care")
    .select("title, profession, area, start_date, end_date, status")
    .eq("id", episode_id).is("archived_at", null).single();
  if (error || !episode) return NextResponse.json({ error: "Episódio não encontrado" }, { status: 404 });
  const { data: sessions, error: sessionsError } = await supabase.from("session")
    .select("date, type, subjective, objective, clinical_analysis, intervention, response, plan")
    .eq("episode_id", episode_id).is("archived_at", null).order("date", { ascending: true });
  const { data: scales, error: scalesError } = await supabase.from("scale_result")
    .select("type, value, applied_at, score_format, koos_subscale")
    .eq("episode_id", episode_id).is("archived_at", null).order("applied_at", { ascending: true });
  if (sessionsError || scalesError) return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });
  return NextResponse.json({ episode, sessions: sessions || [], scales: scales || [] });
}

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateDischargeReport } from "@/lib/reports/generateDischargeReport";
import { Database } from "@/lib/db/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { episode_id } = await req.json();
    if (!episode_id) return NextResponse.json({ error: "episode_id obrigatório" }, { status: 400 });

    const supabase = serverSupabase;
    const { data: episodeData, error: episodeError } = await supabase.from("episode_of_care").select("*").eq("id", episode_id).is("archived_at", null).single();
    if (episodeError || !episodeData) return NextResponse.json({ error: "Episódio não encontrado" }, { status: 404 });
    const episode = (episodeData as Database["public"]["Tables"]["episode_of_care"]["Row"] | null) || null;
    const { data: patientData, error: patientError } = episode
      ? await supabase
          .from("patient")
          .select("internal_code")
          .eq("id", episode.patient_id)
          .single()
      : { data: null, error: null };
    if (patientError || !patientData) return NextResponse.json({ error: "Utente não encontrado" }, { status: 404 });
    const patient = (patientData as Pick<Database["public"]["Tables"]["patient"]["Row"], "internal_code"> | null) || null;
    const { data: sessions, error: sessionsError } = await supabase.from("session").select("*").eq("episode_id", episode_id).is("archived_at", null).order("date", { ascending: true });
    const { data: scales, error: scalesError } = await supabase.from("scale_result").select("*").eq("episode_id", episode_id).is("archived_at", null).order("applied_at", { ascending: true });
    if (sessionsError || scalesError) return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });

    const snapshot = {
      patient: {
        client_code: patient?.internal_code ?? "Não registado",
        name: "[NOME_INTERNO_APP]"
      },
      episode,
      sessions: sessions || [],
      scales: scales || []
    };
    const content = await generateDischargeReport(snapshot);

    const { data: report, error: reportError } = await supabase
      .from("discharge_report_version")
      .insert({
        episode_id,
        generated_by: user.email ?? "system",
        content,
        source_snapshot: snapshot,
        is_final: false
      })
      .select("*")
      .single();

    if (reportError || !report) return NextResponse.json({ error: "Erro ao guardar relatório" }, { status: 500 });

    return NextResponse.json({ report_id: report?.id, content });
  } catch (err) {
    console.error("[discharge-report]", err);
    return NextResponse.json({ error: "Erro ao gerar relatório de alta." }, { status: 500 });
  }
}

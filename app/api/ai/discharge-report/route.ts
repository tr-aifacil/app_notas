import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateDischargeReport } from "@/lib/reports/generateDischargeReport";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { data: profile } = await serverSupabase.from("profile").select("id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Conta sem acesso à app." }, { status: 403 });

  try {
    const { episode_id } = await req.json();
    if (typeof episode_id !== "string" || !/^[0-9a-f-]{36}$/i.test(episode_id)) {
      return NextResponse.json({ error: "Identificador de episódio inválido" }, { status: 400 });
    }

    const supabase = serverSupabase;
    const { data: episode, error: episodeError } = await supabase.from("episode_of_care")
      .select("patient_id, title, profession, area, start_date, end_date, status")
      .eq("id", episode_id).is("archived_at", null).single();
    if (episodeError || !episode) return NextResponse.json({ error: "Episódio não encontrado" }, { status: 404 });
    const { data: patient, error: patientError } = await supabase.from("patient")
      .select("internal_code").eq("id", episode.patient_id).single();
    if (patientError || !patient) return NextResponse.json({ error: "Utente não encontrado" }, { status: 404 });
    const { data: sessions, error: sessionsError } = await supabase.from("session")
      .select("date, type, subjective, objective, clinical_analysis, intervention, response, plan")
      .eq("episode_id", episode_id).is("archived_at", null).order("date", { ascending: true });
    const { data: scales, error: scalesError } = await supabase.from("scale_result")
      .select("type, value, applied_at, score_format, koos_subscale")
      .eq("episode_id", episode_id).is("archived_at", null).order("applied_at", { ascending: true });
    if (sessionsError || scalesError) return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });

    const { patient_id: _patientId, ...episodeForReport } = episode;
    const snapshot = {
      patient: {
        client_code: patient.internal_code,
        name: "[NOME_INTERNO_APP]"
      },
      episode: episodeForReport,
      sessions: sessions || [],
      scales: scales || []
    };
    const aiInput = { ...snapshot, patient: { ...snapshot.patient, client_code: "[CODIGO_UTENTE]" } };
    if (JSON.stringify(aiInput).length > 45000) {
      return NextResponse.json({ error: "O episódio tem texto a mais para gerar o relatório automaticamente. Resume as notas primeiro." }, { status: 413 });
    }
    const generated = await generateDischargeReport(aiInput);
    const content = generated.replaceAll("[CODIGO_UTENTE]", patient.internal_code);

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
    console.error("[discharge-report] Falha ao gerar relatório.");
    return NextResponse.json({ error: "Erro ao gerar relatório de alta." }, { status: 500 });
  }
}

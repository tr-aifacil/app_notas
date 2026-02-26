import { createAdminSupabase } from "@/lib/supabase/server";

const RULES = {
  SCALE_REEVAL_4_6_WEEKS: "SCALE_REEVAL_4_6_WEEKS",
  END_NO_IMPROVEMENT_3: "END_NO_IMPROVEMENT_3",
  END_INCREASE_2: "END_INCREASE_2",
  PLAN_REPEATED_4: "PLAN_REPEATED_4",
  NO_FORMAL_REEVAL: "NO_FORMAL_REEVAL"
} as const;

function normalizeText(t: string) {
  return (t || "").trim().replace(/\s+/g, " ").toLowerCase();
}

async function addAlertIfNotRecent(episodeId: string, ruleCode: string, message: string, sessionId: string | null = null) {
  const supabase = createAdminSupabase();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const { data: existing } = await supabase
    .from("alert_log")
    .select("id")
    .eq("episode_id", episodeId)
    .eq("rule_code", ruleCode)
    .eq("dismissed", false)
    .gte("created_at", sevenDaysAgo)
    .limit(1);

  if (existing && existing.length > 0) return;

  await supabase.from("alert_log").insert({
    episode_id: episodeId,
    session_id: sessionId,
    rule_code: ruleCode,
    message
  });
}

export async function evaluateAlerts(episodeId: string) {
  const supabase = createAdminSupabase();

  const { data: scales = [] } = await supabase
    .from("scale_result")
    .select("*")
    .eq("episode_id", episodeId)
    .order("applied_at", { ascending: true });

  const { data: sessions = [] } = await supabase
    .from("session")
    .select("*")
    .eq("episode_id", episodeId)
    .order("date", { ascending: true });

  const byType = new Map<string, typeof scales>();
  for (const s of scales) {
    byType.set(s.type, [...(byType.get(s.type) || []), s]);
  }
  for (const [type, list] of byType.entries()) {
    const last = list[list.length - 1];
    const days = (Date.now() - new Date(last.applied_at).getTime()) / (1000 * 3600 * 24);
    if (days > 42) {
      await addAlertIfNotRecent(
        episodeId,
        RULES.SCALE_REEVAL_4_6_WEEKS,
        `Reavaliar ${type} (última em ${new Date(last.applied_at).toLocaleDateString("pt-PT")}).`
      );
    }
  }

  const endList = scales.filter((s) => s.type === "END");
  if (endList.length >= 3) {
    const last3 = endList.slice(-3);
    const net = last3[last3.length - 1].value - last3[0].value;
    if (net >= 0) {
      await addAlertIfNotRecent(episodeId, RULES.END_NO_IMPROVEMENT_3, "END sem melhoria nas últimas 3 medições.");
    }
  }
  if (endList.length >= 2) {
    const prev = endList[endList.length - 2].value;
    const last = endList[endList.length - 1].value;
    if (last - prev >= 2) {
      await addAlertIfNotRecent(episodeId, RULES.END_INCREASE_2, "Aumento de END ≥ 2 pontos.");
    }
  }

  if (sessions.length >= 4) {
    const last4 = sessions.slice(-4).map((s) => normalizeText(s.plan));
    if (last4.every((p) => p && p === last4[0])) {
      await addAlertIfNotRecent(episodeId, RULES.PLAN_REPEATED_4, "Plano repetido em ≥ 4 sessões.");
    }
  }

  let countTratamento = 0;
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (s.type === "reavaliacao") break;
    if (s.type === "tratamento") countTratamento++;
  }
  if (countTratamento >= 6) {
    await addAlertIfNotRecent(episodeId, RULES.NO_FORMAL_REEVAL, "Falta de reavaliação formal (>=6 tratamentos).");
  }
}

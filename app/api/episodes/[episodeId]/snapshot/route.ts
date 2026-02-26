import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: { episodeId: string } }) {
  const supabase = createAdminSupabase();
  const episode_id = params.episodeId;
  const { data: episode } = await supabase.from("episode_of_care").select("*").eq("id", episode_id).single();
  const { data: sessions } = await supabase.from("session").select("*").eq("episode_id", episode_id).order("date", { ascending: true });
  const { data: scales } = await supabase.from("scale_result").select("*").eq("episode_id", episode_id).order("applied_at", { ascending: true });
  return NextResponse.json({ episode, sessions: sessions || [], scales: scales || [] });
}

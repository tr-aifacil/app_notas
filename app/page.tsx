import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();

  if (data.user) redirect("/patients");
  redirect("/login");
}

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type UserProfileContext = {
  userId: string;
  email: string | null;
  profile: {
    id: string;
    display_name: string;
    role: "admin" | "clinician";
  };
};

export async function requireUserProfile(): Promise<UserProfileContext> {
  const supabase = createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("id, display_name, role")
    .eq("id", authData.user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return {
    userId: authData.user.id,
    email: authData.user.email ?? null,
    profile,
  };
}

export async function requireAdmin() {
  const context = await requireUserProfile();
  if (context.profile.role !== "admin") {
    redirect("/patients");
  }
  return context;
}

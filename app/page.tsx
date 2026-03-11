import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/auth/guards";

export default async function HomePage() {
  const user = await requireUserProfile();

  if (user.profile.role === "admin") {
    redirect("/admin");
  }

  redirect("/patients");
}

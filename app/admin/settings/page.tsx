import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export default async function GymSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signup");
  }

  const { data: gym } = await supabase
    .from("gyms")
    .select("*")
    .eq("email", user?.email ?? "")
    .single();

  if (!gym) {
    redirect("/admin/onboarding");
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-bold mb-8" style={{ color: "var(--on-surface)" }}>Settings</h1>
      <SettingsForm gym={gym} />
    </div>
  );
}

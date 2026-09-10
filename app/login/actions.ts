"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function loginWithGithub() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=not-configured");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${getSiteUrl()}/auth/callback` },
  });

  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) redirect("/login?error=email");

  const supabase = await createClient();
  if (!supabase) redirect("/login?error=not-configured");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
  });

  if (error) redirect("/login?error=magic-link");
  redirect("/login?sent=1");
}

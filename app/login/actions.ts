"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function loginWithGithub(formData: FormData) {
  const requestedNext = String(formData.get("next") ?? "/app");
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/app";
  const locale = formData.get("locale") === "ru" ? "ru" : "en";
  const supabase = await createClient();
  if (!supabase) redirect(`/login?error=not-configured&locale=${locale}`);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data.url) redirect(`/login?error=oauth&locale=${locale}`);
  redirect(data.url);
}

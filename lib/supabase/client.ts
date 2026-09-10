import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export function createClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase browser credentials are not configured.");
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}

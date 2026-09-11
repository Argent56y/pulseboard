import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type" };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!["GET", "POST"].includes(request.method)) return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SB_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !publishableKey) return Response.json({ error: "Function is not configured" }, { status: 500, headers: cors });
  const requestUrl = new URL(request.url);
  const body = request.method === "POST" ? await request.json().catch(() => ({})) as { token?: string } : {};
  const token = requestUrl.searchParams.get("token") ?? body.token ?? "";
  const client = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { data, error } = await client.rpc("unsubscribe_feedback", { p_token: token });
  if (error || data !== true) return Response.json({ ok: false, error: "This unsubscribe link is invalid or already used." }, { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  return Response.json({ ok: true }, { headers: { ...cors, "Content-Type": "application/json" } });
});

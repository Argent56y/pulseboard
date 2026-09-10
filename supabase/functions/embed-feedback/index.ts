import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });

  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SB_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !url || !publishableKey || !secretKey) return Response.json({ error: "Function is not configured" }, { status: 401, headers: cors });

  const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: authorization! } } });
  const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) return Response.json({ error: "Invalid user token" }, { status: 401, headers: cors });

  const payload = await request.json().catch(() => null) as { feedbackId?: string } | null;
  if (!payload?.feedbackId) return Response.json({ error: "feedbackId is required" }, { status: 400, headers: cors });

  const { data: feedback } = await userClient.from("feedback_posts").select("id,workspace_id,author_id,title,body").eq("id", payload.feedbackId).maybeSingle();
  if (!feedback) return Response.json({ error: "Feedback not found" }, { status: 404, headers: cors });

  const { data: membership } = await userClient.from("workspace_members").select("role").eq("workspace_id", feedback.workspace_id).eq("user_id", userId).maybeSingle();
  if (!membership && feedback.author_id !== userId) return Response.json({ error: "Access denied" }, { status: 403, headers: cors });

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const model = new Supabase.ai.Session("gte-small");
    const embedding = await model.run(`${feedback.title}\n\n${feedback.body}`, { mean_pool: true, normalize: true });
    await admin.from("feedback_posts").update({ embedding, embedding_state: "ready", embedding_error: null }).eq("id", feedback.id);

    const { data: themes } = await admin.from("themes").select("id,name,description,embedding_state").eq("workspace_id", feedback.workspace_id);
    for (const theme of themes ?? []) {
      if (theme.embedding_state === "ready") continue;
      const themeEmbedding = await model.run(`${theme.name}\n\n${theme.description}`, { mean_pool: true, normalize: true });
      await admin.from("themes").update({ embedding: themeEmbedding, embedding_state: "ready" }).eq("id", theme.id);
    }

    const { data: suggestionCount, error: suggestionError } = await admin.rpc("find_theme_suggestions", { p_feedback_id: feedback.id, p_threshold: 0.78, p_count: 5 });
    if (suggestionError) throw suggestionError;
    return Response.json({ ok: true, suggestionCount }, { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Embedding failed";
    await admin.from("feedback_posts").update({ embedding_state: "failed", embedding_error: message.slice(0, 500) }).eq("id", feedback.id);
    return Response.json({ error: "Analysis failed", retryable: true }, { status: 500, headers: cors });
  }
});

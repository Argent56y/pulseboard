import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type AnalysisJob = {
  jobId?: number;
  readCount?: number;
  id: string;
  workspaceId?: string;
  entity?: "feedback_posts" | "themes";
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json", ...extra },
});

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    return [value.code, value.message, value.details, value.hint]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(": ") || "Embedding failed";
  }
  return "Embedding failed";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SB_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !url || !publishableKey || !secretKey) return json({ error: "Function is not configured" }, 401);

  const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: authorization! } }, auth: { persistSession: false } });
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: claimsResult, error: claimsError } = await userClient.auth.getClaims(token);
  const claims = claimsResult?.claims;
  if (claimsError || !claims) return json({ error: "Invalid token" }, 401);

  const body = await request.json().catch(() => null) as AnalysisJob[] | { feedbackId?: string } | null;
  const queueRequest = Array.isArray(body);
  let jobs: AnalysisJob[];
  if (queueRequest) {
    const role = typeof claims.role === "string" ? claims.role : "";
    const queueSecret = request.headers.get("x-pulseboard-queue") ?? "";
    const { data: validWorkerSecret } = await userClient.rpc("validate_worker_secret", { p_secret: queueSecret });
    if (role !== "service_role" && validWorkerSecret !== true) return json({ error: "Queue invocation denied" }, 403);
    jobs = body.slice(0, 20).filter((job) => typeof job?.id === "string" && ["feedback_posts", "themes"].includes(job.entity ?? "feedback_posts"));
  } else {
    const feedbackId = body?.feedbackId;
    const userId = claims.sub;
    if (!feedbackId || typeof userId !== "string") return json({ error: "feedbackId and user session are required" }, 400);
    const { data: feedback } = await userClient.from("feedback_posts").select("id,workspace_id,author_id").eq("id", feedbackId).maybeSingle();
    if (!feedback) return json({ error: "Feedback not found" }, 404);
    const { data: membership } = await userClient.from("workspace_members").select("role").eq("workspace_id", feedback.workspace_id).eq("user_id", userId).maybeSingle();
    if (!membership && feedback.author_id !== userId) return json({ error: "Access denied" }, 403);
    jobs = [{ id: feedback.id, workspaceId: feedback.workspace_id, entity: "feedback_posts" }];
  }

  const model = new Supabase.ai.Session("gte-small");
  const completed: AnalysisJob[] = [];
  const failed: Array<AnalysisJob & { error: string }> = [];

  for (const job of jobs) {
    try {
      if (job.entity === "themes") {
        const { data: theme, error } = await admin.from("themes").select("id,workspace_id,name,description").eq("id", job.id).maybeSingle();
        if (error || !theme) throw error ?? new Error("Theme not found");
        const embedding = await model.run(`${theme.name}\n\n${theme.description}`, { mean_pool: true, normalize: true });
        const updated = await admin.from("themes").update({ embedding, embedding_state: "ready" }).eq("id", theme.id);
        if (updated.error) throw updated.error;
      } else {
        const { data: feedback, error } = await admin.from("feedback_posts").select("id,workspace_id,title,body").eq("id", job.id).maybeSingle();
        if (error || !feedback) throw error ?? new Error("Feedback not found");
        const embedding = await model.run(`${feedback.title}\n\n${feedback.body}`, { mean_pool: true, normalize: true });
        const updated = await admin.from("feedback_posts").update({ embedding, embedding_state: "ready", embedding_error: null }).eq("id", feedback.id);
        if (updated.error) throw updated.error;
        const [themes, duplicates] = await Promise.all([
          admin.rpc("find_theme_suggestions", { p_feedback_id: feedback.id, p_threshold: 0.78, p_count: 5 }),
          admin.rpc("find_duplicate_suggestions", { p_feedback_id: feedback.id, p_threshold: 0.86, p_count: 3 }),
        ]);
        if (themes.error) throw themes.error;
        if (duplicates.error) throw duplicates.error;
      }
      if (job.jobId) await admin.rpc("delete_analysis_job", { p_msg_id: job.jobId });
      completed.push(job);
    } catch (error) {
      const message = errorMessage(error);
      console.error("analysis-job-failed", { id: job.id, entity: job.entity ?? "feedback_posts", message });
      const finalAttempt = (job.readCount ?? 0) >= 5;
      if (job.entity === "themes") {
        await admin.from("themes").update({ embedding_state: finalAttempt ? "failed" : "pending" }).eq("id", job.id);
      } else {
        await admin.from("feedback_posts").update({ embedding_state: finalAttempt ? "failed" : "pending", embedding_error: message.slice(0, 500) }).eq("id", job.id);
      }
      if (finalAttempt && job.jobId) await admin.rpc("delete_analysis_job", { p_msg_id: job.jobId });
      failed.push({ ...job, error: message });
    }
  }

  const status = !queueRequest && failed.length ? 500 : 200;
  return json({ completed, failed }, status, { "x-completed-jobs": String(completed.length), "x-failed-jobs": String(failed.length) });
});

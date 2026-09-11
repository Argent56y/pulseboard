import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type EmailJob = {
  id: number;
  workspace_id: string;
  feedback_id: string;
  subscription_id: string;
  recipient: string;
  event_type: "staff_reply" | "status_changed" | "shipped";
  payload: Record<string, unknown>;
  idempotency_key: string;
  attempts: number;
};

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!);

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SB_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("PULSEBOARD_SENDER_EMAIL");
  const siteUrl = (Deno.env.get("PULSEBOARD_SITE_URL") ?? "https://pulseboard-by-seva.bodya1232.chatgpt.site").replace(/\/$/, "");
  if (!url || !publishableKey || !secretKey) return Response.json({ error: "Supabase environment is missing" }, { status: 500 });

  const authorization = request.headers.get("Authorization") ?? "";
  const publicClient = createClient(url, publishableKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const queueSecret = request.headers.get("x-pulseboard-queue") ?? "";
  const { data: validWorkerSecret } = await publicClient.rpc("validate_worker_secret", { p_secret: queueSecret });
  if (validWorkerSecret !== true) return Response.json({ error: "Worker authentication failed" }, { status: 403 });
  if (!resendKey || !sender) return Response.json({ error: "Resend is not configured" }, { status: 503 });

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc("claim_email_jobs", { p_limit: 20 });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const jobs = (data ?? []) as EmailJob[];
  const results: Array<{ id: number; sent: boolean; error?: string }> = [];

  for (const job of jobs) {
    try {
      const [{ data: workspace }, { data: feedback }, tokenResult] = await Promise.all([
        admin.from("workspaces").select("name,slug").eq("id", job.workspace_id).single(),
        admin.from("feedback_posts").select("title,status").eq("id", job.feedback_id).single(),
        admin.rpc("create_unsubscribe_token", { p_subscription_id: job.subscription_id }),
      ]);
      if (!workspace || !feedback || tokenResult.error || !tokenResult.data) throw new Error("Email context could not be loaded");
      const feedbackUrl = `${siteUrl}/feedback/${workspace.slug}/post/${job.feedback_id}`;
      const unsubscribeUrl = `${siteUrl}/unsubscribe/${encodeURIComponent(tokenResult.data)}`;
      const status = String(job.payload.status ?? feedback.status).replaceAll("_", " ");
      const copy = job.event_type === "staff_reply"
        ? { subject: `${workspace.name} replied to “${feedback.title}”`, eyebrow: "New team reply", message: escapeHtml(job.payload.body) }
        : job.event_type === "shipped"
          ? { subject: `Shipped: ${feedback.title}`, eyebrow: "Your request shipped", message: `The team marked this request as <strong>${escapeHtml(status)}</strong>.` }
          : { subject: `Status update: ${feedback.title}`, eyebrow: "Roadmap status changed", message: `This request is now <strong>${escapeHtml(status)}</strong>.` };
      const html = `<!doctype html><html><body style="margin:0;background:#202529;color:#f1eee7;font-family:Arial,sans-serif"><div style="max-width:600px;margin:auto;padding:48px 24px"><div style="font:12px monospace;letter-spacing:.14em;color:#afc1c7;text-transform:uppercase">${copy.eyebrow}</div><h1 style="font-size:28px;line-height:1.15;margin:18px 0">${escapeHtml(feedback.title)}</h1><p style="font-size:16px;line-height:1.7;color:#b7c0c4">${copy.message}</p><a href="${feedbackUrl}" style="display:inline-block;margin-top:18px;padding:12px 18px;border-radius:8px;background:#f1eee7;color:#202529;text-decoration:none;font-weight:700">View the evidence</a><p style="margin-top:44px;font-size:12px;color:#718087">You received this because you followed this feedback. <a href="${unsubscribeUrl}" style="color:#afc1c7">Unsubscribe</a>.</p></div></body></html>`;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": job.idempotency_key },
        body: JSON.stringify({ from: sender, to: [job.recipient], subject: copy.subject, html }),
      });
      if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
      await admin.rpc("complete_email_job", { p_id: job.id });
      results.push({ id: job.id, sent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email delivery failed";
      await admin.rpc("fail_email_job", { p_id: job.id, p_error: message });
      results.push({ id: job.id, sent: false, error: message });
    }
  }

  return Response.json({ processed: results.length, results });
});

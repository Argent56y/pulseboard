"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canTransitionFeedbackStatus } from "@/lib/domain";
import type { FeedbackStatus } from "@/lib/types";
import {
  commentSchema,
  feedbackSchema,
  roadmapItemSchema,
  statusSchema,
  suggestionReviewSchema,
  themeSchema,
  workspaceSchema,
} from "@/lib/validations";

export interface ActionResult {
  ok: boolean;
  message: string;
  value?: string;
}

const unavailable: ActionResult = {
  ok: false,
  message: "Connect Supabase to enable persistent changes.",
};

async function authenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;
  return { supabase, userId };
}

export async function createWorkspace(formData: FormData): Promise<ActionResult> {
  const parsed = workspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const auth = await authenticatedClient();
  if (!auth) return unavailable;

  const { data: workspace, error } = await auth.supabase
    .from("workspaces")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: "A public place for customer feedback and product decisions.",
      created_by: auth.userId,
    })
    .select("id,slug")
    .single();

  if (error || !workspace) return { ok: false, message: error?.message ?? "Could not create workspace." };

  redirect(`/app/${workspace.slug}/map`);
}

export async function createFeedback(formData: FormData): Promise<ActionResult> {
  const parsed = feedbackSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    boardId: formData.get("boardId"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const auth = await authenticatedClient();
  if (!auth) return { ok: false, message: "Sign in to submit feedback." };

  const { data: feedback, error } = await auth.supabase.from("feedback_posts").insert({
    workspace_id: parsed.data.workspaceId,
    board_id: parsed.data.boardId,
    author_id: auth.userId,
    title: parsed.data.title,
    body: parsed.data.body,
    source: "portal",
  }).select("id").single();

  if (error) return { ok: false, message: error.message };
  if (feedback) {
    await auth.supabase.functions.invoke("embed-feedback", { body: { feedbackId: feedback.id } }).catch(() => undefined);
  }
  revalidatePath("/feedback", "layout");
  return { ok: true, message: "Feedback submitted." };
}

export async function retryFeedbackAnalysis(feedbackId: string): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return unavailable;
  const { error: resetError } = await auth.supabase.from("feedback_posts").update({ embedding_state: "pending", embedding_error: null }).eq("id", feedbackId);
  if (resetError) return { ok: false, message: resetError.message };
  const { error } = await auth.supabase.functions.invoke("embed-feedback", { body: { feedbackId } });
  revalidatePath("/app", "layout");
  return error ? { ok: false, message: "Analysis could not be restarted." } : { ok: true, message: "Analysis restarted." };
}

export async function toggleVote(feedbackId: string): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, message: "Sign in to vote." };

  const { data: current } = await auth.supabase
    .from("feedback_votes")
    .select("id")
    .eq("feedback_id", feedbackId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  const result = current
    ? await auth.supabase.from("feedback_votes").delete().eq("id", current.id)
    : await auth.supabase.from("feedback_votes").insert({
        feedback_id: feedbackId,
        user_id: auth.userId,
      });

  if (result.error) return { ok: false, message: result.error.message };
  revalidatePath("/feedback", "layout");
  return { ok: true, message: current ? "Vote removed." : "Vote added." };
}

export async function addComment(formData: FormData): Promise<ActionResult> {
  const parsed = commentSchema.safeParse({
    feedbackId: formData.get("feedbackId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const auth = await authenticatedClient();
  if (!auth) return { ok: false, message: "Sign in to comment." };

  const { data: post } = await auth.supabase
    .from("feedback_posts")
    .select("workspace_id")
    .eq("id", parsed.data.feedbackId)
    .single();
  if (!post) return { ok: false, message: "Feedback not found." };

  const { data: member } = await auth.supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", post.workspace_id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  const { error } = await auth.supabase.from("feedback_comments").insert({
    workspace_id: post.workspace_id,
    feedback_id: parsed.data.feedbackId,
    author_id: auth.userId,
    body: parsed.data.body,
    is_staff: Boolean(member),
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/feedback", "layout");
  return { ok: true, message: "Comment added." };
}

export async function updateFeedbackStatus(input: {
  feedbackId: string;
  status: string;
}): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const auth = await authenticatedClient();
  if (!auth) return unavailable;

  const { data: current } = await auth.supabase.from("feedback_posts").select("status").eq("id", parsed.data.feedbackId).maybeSingle();
  if (!current || !canTransitionFeedbackStatus(current.status as FeedbackStatus, parsed.data.status)) {
    return { ok: false, message: "That status transition is not allowed." };
  }

  const { error } = await auth.supabase
    .from("feedback_posts")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.feedbackId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  revalidatePath("/feedback", "layout");
  return { ok: true, message: "Status updated." };
}

export async function reviewSuggestion(input: {
  linkId: string;
  state: "confirmed" | "rejected";
}): Promise<ActionResult> {
  const parsed = suggestionReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const auth = await authenticatedClient();
  if (!auth) return unavailable;

  const { error } = await auth.supabase
    .from("feedback_theme_links")
    .update({ state: parsed.data.state, reviewed_by: auth.userId, reviewed_at: new Date().toISOString() })
    .eq("id", parsed.data.linkId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: `Suggestion ${parsed.data.state}.` };
}

export async function createTheme(formData: FormData): Promise<ActionResult> {
  const parsed = themeSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const auth = await authenticatedClient();
  if (!auth) return unavailable;

  const { error } = await auth.supabase.from("themes").insert({
    workspace_id: parsed.data.workspaceId,
    name: parsed.data.name,
    description: parsed.data.description,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Theme created." };
}

export async function createRoadmapItem(formData: FormData): Promise<ActionResult> {
  const parsed = roadmapItemSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    targetWindow: formData.get("targetWindow"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const auth = await authenticatedClient();
  if (!auth) return unavailable;

  const { error } = await auth.supabase.from("roadmap_items").insert({
    workspace_id: parsed.data.workspaceId,
    title: parsed.data.title,
    summary: parsed.data.summary,
    target_window: parsed.data.targetWindow,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Roadmap item created." };
}

export async function publishChangelog(formData: FormData): Promise<ActionResult> {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!workspaceId || title.length < 4 || body.length < 12) {
    return { ok: false, message: "Add a title and a useful update." };
  }
  const auth = await authenticatedClient();
  if (!auth) return unavailable;

  const { error } = await auth.supabase.from("changelog_entries").insert({
    workspace_id: workspaceId,
    title,
    body,
    published_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  revalidatePath("/feedback", "layout");
  return { ok: true, message: "Update published." };
}

export async function createInvite(formData: FormData): Promise<ActionResult> {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const role = formData.get("role") === "owner" ? "owner" : "editor";
  if (!workspaceId) return { ok: false, message: "Workspace is required." };
  const auth = await authenticatedClient();
  if (!auth) return unavailable;

  const token = randomUUID();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await auth.supabase.from("workspace_invitations").insert({
    workspace_id: workspaceId,
    role,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: auth.userId,
  });
  if (error) return { ok: false, message: error.message };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { ok: true, message: "Invite link created.", value: `${origin}/invite/${token}` };
}

export async function acceptInvite(token: string): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, message: "Sign in before accepting an invitation." };

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await auth.supabase.rpc("accept_workspace_invitation", {
    p_token_hash: tokenHash,
  });

  if (error) {
    return { ok: false, message: "This invitation is invalid or expired." };
  }

  return { ok: true, message: "Invitation accepted." };
}

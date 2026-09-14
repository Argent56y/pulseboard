"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canTransitionFeedbackStatus } from "@/lib/domain";
import { getSiteUrl } from "@/lib/site-url";
import type { DuplicateCandidate, FeedbackStatus } from "@/lib/types";
import {
  commentSchema,
  changelogSchema,
  feedbackSchema,
  importRowSchema,
  roadmapItemSchema,
  roadmapStatusSchema,
  statusSchema,
  suggestionReviewSchema,
  themeSchema,
  workspaceSettingsSchema,
  workspaceSchema,
} from "@/lib/validations";
import type { FeedbackSource, RoadmapStatus, WorkspaceRole } from "@/lib/types";

export interface ActionResult<T = string> {
  ok: boolean;
  message: string;
  value?: T;
  fieldErrors?: Record<string, string[]>;
}

const unavailable: ActionResult = {
  ok: false,
  message: "Connect Supabase to enable persistent changes.",
};

function mutationErrorMessage(
  error: { code?: string; message: string } | null,
  fallback: string,
) {
  if (!error) return fallback;
  if (error.message.includes("Rate limit exceeded")) {
    return "You have reached the hourly limit. Please wait a little and try again.";
  }
  if (error.code === "42501" || error.message.toLowerCase().includes("row-level security")) {
    return "You do not have permission to make this change.";
  }
  return fallback;
}

async function authenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  return { supabase, userId, email };
}

async function authorizedWorkspace(workspaceId: string, ownerOnly = false) {
  const auth = await authenticatedClient();
  if (!auth) return null;
  const { data: membership } = await auth.supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!membership || (ownerOnly && membership.role !== "owner")) return null;
  return { ...auth, role: membership.role };
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

  if (error || !workspace) {
    const slugTaken = error?.code === "23505" && error.message.includes("slug");
    return { ok: false, message: slugTaken ? "That workspace URL is already taken." : error?.message ?? "Could not create workspace." };
  }

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

  if (error) {
    return {
      ok: false,
      message: mutationErrorMessage(error, "Feedback could not be submitted. Please try again."),
    };
  }
  if (feedback && auth.email) {
    await auth.supabase.from("feedback_subscriptions").upsert({
      workspace_id: parsed.data.workspaceId,
      feedback_id: feedback.id,
      user_id: auth.userId,
      email: auth.email,
      is_active: true,
      unsubscribed_at: null,
    }, { onConflict: "feedback_id,user_id" });
  }
  revalidatePath("/feedback", "layout");
  return { ok: true, message: "Feedback submitted.", value: feedback?.id };
}

export async function findPotentialDuplicates(input: {
  workspaceId: string;
  title: string;
  body: string;
}): Promise<ActionResult<DuplicateCandidate[]>> {
  const parsed = feedbackSchema.pick({ workspaceId: true, title: true, body: true }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, value: [] };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: unavailable.message, value: [] };
  const { data, error } = await supabase.rpc("find_public_feedback_matches", {
    p_workspace_id: parsed.data.workspaceId,
    p_title: parsed.data.title,
    p_body: parsed.data.body,
    p_limit: 3,
  });
  if (error) return { ok: false, message: "Similar ideas could not be checked.", value: [] };
  return {
    ok: true,
    message: data.length ? "We found a few ideas that may already cover this." : "No close matches found.",
    value: data.map((row) => ({ id: row.id, title: row.title, body: row.body, status: row.status, votes: Number(row.vote_count), rank: row.rank })),
  };
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

export async function toggleVote(
  feedbackId: string,
): Promise<ActionResult<{ voted: boolean; votes: number }>> {
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, message: "Sign in to vote." };

  const [{ data: current }, { data: post }] = await Promise.all([
    auth.supabase
    .from("feedback_votes")
    .select("id")
    .eq("feedback_id", feedbackId)
    .eq("user_id", auth.userId)
    .maybeSingle(),
    auth.supabase.from("feedback_posts").select("workspace_id,visibility").eq("id", feedbackId).maybeSingle(),
  ]);
  if (!post || post.visibility !== "published") return { ok: false, message: "This idea is not open for voting." };

  const result = current
      ? await auth.supabase.from("feedback_votes").delete().eq("id", current.id)
      : await auth.supabase.from("feedback_votes").insert({
        feedback_id: feedbackId,
        user_id: auth.userId,
        workspace_id: post.workspace_id,
      });

  if (result.error) {
    return {
      ok: false,
      message: mutationErrorMessage(result.error, "Your vote could not be saved. Please try again."),
    };
  }

  const { count } = await auth.supabase
    .from("feedback_votes")
    .select("id", { count: "exact", head: true })
    .eq("feedback_id", feedbackId);
  const voted = !current;
  revalidatePath("/feedback", "layout");
  return {
    ok: true,
    message: voted ? "Vote added." : "Vote removed.",
    value: { voted, votes: count ?? 0 },
  };
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

  const { data: comment, error } = await auth.supabase.from("feedback_comments").insert({
    workspace_id: post.workspace_id,
    feedback_id: parsed.data.feedbackId,
    author_id: auth.userId,
    body: parsed.data.body,
    is_staff: Boolean(member),
  }).select("id").single();

  if (error) {
    return {
      ok: false,
      message: mutationErrorMessage(error, "Your comment could not be posted. Please try again."),
    };
  }
  revalidatePath("/feedback", "layout");
  return { ok: true, message: "Comment added.", value: comment?.id };
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
  const auth = await authorizedWorkspace(parsed.data.workspaceId);
  if (!auth) return { ok: false, message: "Editor access is required." };

  const { data: item, error } = await auth.supabase.from("roadmap_items").insert({
    workspace_id: parsed.data.workspaceId,
    title: parsed.data.title,
    summary: parsed.data.summary,
    target_window: parsed.data.targetWindow,
  }).select("id").single();
  if (error || !item) return { ok: false, message: error?.message ?? "Could not create the roadmap item." };
  const themeIds = formData.getAll("themeIds").map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (themeIds.length) {
    const linked = await auth.supabase.from("roadmap_theme_links").insert(themeIds.map((themeId) => ({ workspace_id: parsed.data.workspaceId, roadmap_item_id: item.id, theme_id: themeId })));
    if (linked.error) return { ok: false, message: linked.error.message };
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: "Roadmap item created.", value: item.id };
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
  const auth = await authorizedWorkspace(workspaceId, true);
  if (!auth) return { ok: false, message: "Only the workspace owner can create invite links." };

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

  const origin = getSiteUrl();
  return { ok: true, message: "Invite link created.", value: `${origin}/invite/${token}` };
}

export async function acceptInvite(token: string): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, message: "Sign in before accepting an invitation." };

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await auth.supabase.rpc("accept_workspace_invitation", {
    p_token_hash: tokenHash,
  });

  if (error) {
    if (error.message.includes("Already a workspace member")) {
      return { ok: true, message: "You already belong to this workspace.", value: "/app" };
    }
    return { ok: false, message: "This invitation is invalid or expired." };
  }

  const acceptedWorkspaceId = data?.[0]?.workspace_id;
  if (!acceptedWorkspaceId) return { ok: true, message: "Invitation accepted.", value: "/app" };

  const { data: workspace } = await auth.supabase
    .from("workspaces")
    .select("slug")
    .eq("id", acceptedWorkspaceId)
    .maybeSingle();

  return {
    ok: true,
    message: "Invitation accepted.",
    value: workspace ? `/app/${workspace.slug}/inbox` : "/app",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

export async function updateWorkspaceSettings(formData: FormData): Promise<ActionResult> {
  const parsed = workspaceSettingsSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    description: formData.get("description"),
    isPublic: formData.get("isPublic") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const auth = await authorizedWorkspace(parsed.data.workspaceId, true);
  if (!auth) return { ok: false, message: "Only the workspace owner can change these settings." };
  const { error } = await auth.supabase.from("workspaces").update({
    name: parsed.data.name,
    description: parsed.data.description,
    is_public: parsed.data.isPublic,
  }).eq("id", parsed.data.workspaceId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  revalidatePath("/feedback", "layout");
  return { ok: true, message: "Workspace settings saved." };
}

export async function moderateFeedback(input: {
  feedbackId: string;
  visibility: "published" | "hidden" | "merged";
  duplicateOfId?: string;
}): Promise<ActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.feedbackId)) return { ok: false, message: "Invalid feedback id." };
  const auth = await authenticatedClient();
  if (!auth) return unavailable;
  const { data: post } = await auth.supabase.from("feedback_posts").select("workspace_id").eq("id", input.feedbackId).maybeSingle();
  if (!post || !await authorizedWorkspace(post.workspace_id)) return { ok: false, message: "Editor access is required." };
  if (input.visibility === "merged" && (!input.duplicateOfId || input.duplicateOfId === input.feedbackId)) return { ok: false, message: "Choose a different canonical idea." };
  const { error } = await auth.supabase.from("feedback_posts").update({
    visibility: input.visibility,
    duplicate_of_id: input.visibility === "merged" ? input.duplicateOfId : null,
  }).eq("id", input.feedbackId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  revalidatePath("/feedback", "layout");
  return { ok: true, message: input.visibility === "hidden" ? "Feedback hidden as spam." : input.visibility === "merged" ? "Feedback merged into the canonical idea." : "Feedback published." };
}

export async function reviewDuplicateSuggestion(input: {
  linkId: string;
  state: "confirmed" | "rejected";
}): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return unavailable;
  const { data: link } = await auth.supabase.from("feedback_duplicate_links").select("workspace_id,feedback_id,duplicate_id").eq("id", input.linkId).maybeSingle();
  if (!link || !await authorizedWorkspace(link.workspace_id)) return { ok: false, message: "Editor access is required." };
  const { error } = await auth.supabase.from("feedback_duplicate_links").update({ state: input.state, reviewed_by: auth.userId, reviewed_at: new Date().toISOString() }).eq("id", input.linkId);
  if (error) return { ok: false, message: error.message };
  if (input.state === "confirmed") {
    const merged = await moderateFeedback({ feedbackId: link.feedback_id, visibility: "merged", duplicateOfId: link.duplicate_id });
    if (!merged.ok) return merged;
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: `Duplicate suggestion ${input.state}.` };
}

export async function updateTheme(formData: FormData): Promise<ActionResult> {
  const themeId = String(formData.get("themeId") ?? "");
  const parsed = themeSchema.safeParse({ workspaceId: formData.get("workspaceId"), name: formData.get("name"), description: formData.get("description") });
  if (!parsed.success || !/^[0-9a-f-]{36}$/i.test(themeId)) return { ok: false, message: parsed.success ? "Invalid theme." : parsed.error.issues[0].message };
  const auth = await authorizedWorkspace(parsed.data.workspaceId);
  if (!auth) return { ok: false, message: "Editor access is required." };
  const { error } = await auth.supabase.from("themes").update({ name: parsed.data.name, description: parsed.data.description }).eq("id", themeId).eq("workspace_id", parsed.data.workspaceId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Theme updated and queued for analysis." };
}

export async function deleteTheme(themeId: string): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return unavailable;
  const { data: theme } = await auth.supabase.from("themes").select("workspace_id").eq("id", themeId).maybeSingle();
  if (!theme || !await authorizedWorkspace(theme.workspace_id)) return { ok: false, message: "Editor access is required." };
  const [{ count: feedbackLinks }, { count: roadmapLinks }] = await Promise.all([
    auth.supabase.from("feedback_theme_links").select("id", { count: "exact", head: true }).eq("theme_id", themeId).neq("state", "rejected"),
    auth.supabase.from("roadmap_theme_links").select("theme_id", { count: "exact", head: true }).eq("theme_id", themeId),
  ]);
  if ((feedbackLinks ?? 0) + (roadmapLinks ?? 0) > 0) return { ok: false, message: "Only empty themes can be deleted. Remove their links first." };
  const { error } = await auth.supabase.from("themes").delete().eq("id", themeId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Empty theme deleted." };
}

export async function linkFeedbackToTheme(input: { feedbackId: string; themeId: string }): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return unavailable;
  const [{ data: feedback }, { data: theme }] = await Promise.all([
    auth.supabase.from("feedback_posts").select("workspace_id").eq("id", input.feedbackId).maybeSingle(),
    auth.supabase.from("themes").select("workspace_id").eq("id", input.themeId).maybeSingle(),
  ]);
  if (!feedback || !theme || feedback.workspace_id !== theme.workspace_id || !await authorizedWorkspace(feedback.workspace_id)) return { ok: false, message: "The signal and theme must belong to your workspace." };
  const { error } = await auth.supabase.from("feedback_theme_links").upsert({
    workspace_id: feedback.workspace_id,
    feedback_id: input.feedbackId,
    theme_id: input.themeId,
    state: "confirmed",
    similarity: 1,
    reviewed_by: auth.userId,
    reviewed_at: new Date().toISOString(),
  }, { onConflict: "feedback_id,theme_id" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Signal linked to theme." };
}

export async function updateRoadmapItem(formData: FormData): Promise<ActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  const parsed = roadmapItemSchema.safeParse({ workspaceId: formData.get("workspaceId"), title: formData.get("title"), summary: formData.get("summary"), targetWindow: formData.get("targetWindow") });
  if (!parsed.success || !/^[0-9a-f-]{36}$/i.test(itemId)) return { ok: false, message: parsed.success ? "Invalid roadmap item." : parsed.error.issues[0].message };
  const auth = await authorizedWorkspace(parsed.data.workspaceId);
  if (!auth) return { ok: false, message: "Editor access is required." };
  const themeIds = formData.getAll("themeIds").map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const { error } = await auth.supabase.from("roadmap_items").update({ title: parsed.data.title, summary: parsed.data.summary, target_window: parsed.data.targetWindow }).eq("id", itemId).eq("workspace_id", parsed.data.workspaceId);
  if (error) return { ok: false, message: error.message };
  await auth.supabase.from("roadmap_theme_links").delete().eq("roadmap_item_id", itemId);
  if (themeIds.length) {
    const linked = await auth.supabase.from("roadmap_theme_links").insert(themeIds.map((themeId) => ({ workspace_id: parsed.data.workspaceId, roadmap_item_id: itemId, theme_id: themeId })));
    if (linked.error) return { ok: false, message: linked.error.message };
  }
  revalidatePath("/app", "layout");
  revalidatePath("/feedback", "layout");
  return { ok: true, message: "Roadmap item updated." };
}

export async function changeRoadmapStatus(input: { itemId: string; status: RoadmapStatus; confirmed?: boolean }): Promise<ActionResult<number>> {
  const parsed = roadmapStatusSchema.safeParse({ ...input, confirmed: Boolean(input.confirmed) });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, message: unavailable.message };
  const { data, error } = await auth.supabase.rpc("update_roadmap_status", { p_item_id: parsed.data.itemId, p_status: parsed.data.status, p_confirm: parsed.data.confirmed });
  if (error || !data?.[0]) return { ok: false, message: error?.message ?? "Could not update the roadmap." };
  const result = data[0];
  if (!result.updated) return { ok: false, message: `${result.affected_feedback} linked feedback items will also change status. Confirm to continue.`, value: result.affected_feedback };
  revalidatePath("/app", "layout");
  revalidatePath("/feedback", "layout");
  return { ok: true, message: result.affected_feedback ? `Roadmap and ${result.affected_feedback} linked feedback items updated.` : "Roadmap status updated.", value: result.affected_feedback };
}

export async function deleteRoadmapItem(itemId: string): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return unavailable;
  const { data: item } = await auth.supabase.from("roadmap_items").select("workspace_id").eq("id", itemId).maybeSingle();
  if (!item || !await authorizedWorkspace(item.workspace_id)) return { ok: false, message: "Editor access is required." };
  const { error } = await auth.supabase.from("roadmap_items").delete().eq("id", itemId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  revalidatePath("/feedback", "layout");
  return { ok: true, message: "Roadmap item deleted." };
}

export async function reorderRoadmapItems(workspaceId: string, itemIds: string[]): Promise<ActionResult> {
  const auth = await authorizedWorkspace(workspaceId);
  if (!auth) return { ok: false, message: "Editor access is required." };
  if (itemIds.length > 100 || itemIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) return { ok: false, message: "Invalid roadmap order." };
  const updates = await Promise.all(itemIds.map((id, sortOrder) => auth.supabase.from("roadmap_items").update({ sort_order: sortOrder }).eq("id", id).eq("workspace_id", workspaceId)));
  const error = updates.find((result) => result.error)?.error;
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Roadmap order saved." };
}

export async function saveChangelog(formData: FormData): Promise<ActionResult> {
  const rawId = String(formData.get("id") ?? "");
  const rawRoadmap = String(formData.get("roadmapItemId") ?? "");
  const parsed = changelogSchema.safeParse({ id: rawId || undefined, workspaceId: formData.get("workspaceId"), roadmapItemId: rawRoadmap || undefined, title: formData.get("title"), body: formData.get("body"), publish: formData.get("publish") === "true" });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const auth = await authorizedWorkspace(parsed.data.workspaceId);
  if (!auth) return { ok: false, message: "Editor access is required." };
  const values = { roadmap_item_id: parsed.data.roadmapItemId ?? null, title: parsed.data.title, body: parsed.data.body, published_at: parsed.data.publish ? new Date().toISOString() : null };
  const result = parsed.data.id
    ? await auth.supabase.from("changelog_entries").update(values).eq("id", parsed.data.id).eq("workspace_id", parsed.data.workspaceId)
    : await auth.supabase.from("changelog_entries").insert({ ...values, workspace_id: parsed.data.workspaceId });
  if (result.error) return { ok: false, message: result.error.message };
  revalidatePath("/app", "layout");
  revalidatePath("/feedback", "layout");
  return { ok: true, message: parsed.data.publish ? "Changelog entry published." : "Draft saved." };
}

export async function setChangelogPublished(entryId: string, publish: boolean): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return unavailable;
  const { data: entry } = await auth.supabase.from("changelog_entries").select("workspace_id").eq("id", entryId).maybeSingle();
  if (!entry || !await authorizedWorkspace(entry.workspace_id)) return { ok: false, message: "Editor access is required." };
  const { error } = await auth.supabase.from("changelog_entries").update({ published_at: publish ? new Date().toISOString() : null }).eq("id", entryId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  revalidatePath("/feedback", "layout");
  return { ok: true, message: publish ? "Update published." : "Update moved back to drafts." };
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return unavailable;
  const { data: invite } = await auth.supabase.from("workspace_invitations").select("workspace_id").eq("id", inviteId).maybeSingle();
  if (!invite || !await authorizedWorkspace(invite.workspace_id, true)) return { ok: false, message: "Owner access is required." };
  const { error } = await auth.supabase.from("workspace_invitations").update({ revoked_at: new Date().toISOString() }).eq("id", inviteId).is("accepted_at", null);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Invite link revoked." };
}

export async function updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<ActionResult> {
  const auth = await authorizedWorkspace(workspaceId, true);
  if (!auth) return { ok: false, message: "Owner access is required." };
  if (userId === auth.userId) return { ok: false, message: "Transfer ownership before changing your own role." };
  const { error } = await auth.supabase.from("workspace_members").update({ role }).eq("workspace_id", workspaceId).eq("user_id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Member role updated." };
}

export async function removeMember(workspaceId: string, userId: string): Promise<ActionResult> {
  const auth = await authorizedWorkspace(workspaceId, true);
  if (!auth) return { ok: false, message: "Owner access is required." };
  if (userId === auth.userId) return { ok: false, message: "The owner cannot remove themselves." };
  const { error } = await auth.supabase.from("workspace_members").delete().eq("workspace_id", workspaceId).eq("user_id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Member removed." };
}

export async function deleteWorkspace(workspaceId: string, confirmationSlug: string): Promise<ActionResult> {
  const auth = await authorizedWorkspace(workspaceId, true);
  if (!auth) return { ok: false, message: "Owner access is required." };
  const { data: workspace } = await auth.supabase.from("workspaces").select("slug").eq("id", workspaceId).maybeSingle();
  if (!workspace || workspace.slug !== confirmationSlug.trim()) return { ok: false, message: "Type the exact workspace slug to confirm deletion." };
  const { error } = await auth.supabase.from("workspaces").delete().eq("id", workspaceId);
  if (error) return { ok: false, message: error.message };
  redirect("/app");
}

export interface ImportFeedbackRow {
  title: string;
  body: string;
  authorName?: string;
  source?: FeedbackSource;
  status?: FeedbackStatus;
  createdAt?: string;
  externalId?: string;
  rowIndex: number;
}

export async function createFeedbackImport(input: { workspaceId: string; filename: string; totalRows: number }): Promise<ActionResult<string>> {
  const auth = await authorizedWorkspace(input.workspaceId);
  if (!auth) return { ok: false, message: "Editor access is required." };
  if (!input.filename || input.filename.length > 255 || input.totalRows < 1 || input.totalRows > 1000) return { ok: false, message: "CSV must contain between 1 and 1000 rows." };
  const { data, error } = await auth.supabase.from("feedback_imports").insert({ workspace_id: input.workspaceId, filename: input.filename, total_rows: input.totalRows, state: "processing", created_by: auth.userId }).select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not start the import." };
  return { ok: true, message: "Import started.", value: data.id };
}

export async function importFeedbackBatch(input: { importId: string; workspaceId: string; boardId: string; rows: ImportFeedbackRow[] }): Promise<ActionResult<number>> {
  const auth = await authorizedWorkspace(input.workspaceId);
  if (!auth) return { ok: false, message: "Editor access is required." };
  if (input.rows.length < 1 || input.rows.length > 200) return { ok: false, message: "Each import batch must contain 1–200 rows." };
  const parsedRows = input.rows.map((row) => importRowSchema.safeParse(row));
  const valid = parsedRows.flatMap((result) => result.success ? [result.data] : []);
  const failed = parsedRows.length - valid.length;
  const payload = valid.map((row) => ({
    workspace_id: input.workspaceId,
    board_id: input.boardId,
    author_id: null,
    author_name_snapshot: row.authorName || "Imported customer",
    title: row.title,
    body: row.body,
    source: row.source,
    status: row.status,
    created_at: row.createdAt,
    import_id: input.importId,
    import_row_index: row.rowIndex,
    external_id: row.externalId || null,
  }));
  const { data, error } = payload.length ? await auth.supabase.from("feedback_posts").upsert(payload, { onConflict: "import_id,import_row_index", ignoreDuplicates: true }).select("id") : { data: [], error: null };
  if (error) return { ok: false, message: error.message, value: 0 };
  const imported = data?.length ?? 0;
  const { data: current } = await auth.supabase.from("feedback_imports").select("imported_rows,failed_rows,total_rows").eq("id", input.importId).eq("workspace_id", input.workspaceId).maybeSingle();
  if (current) {
    const importedRows = current.imported_rows + imported;
    const failedRows = current.failed_rows + failed;
    const complete = importedRows + failedRows >= current.total_rows;
    await auth.supabase.from("feedback_imports").update({ imported_rows: importedRows, failed_rows: failedRows, state: complete ? (failedRows ? "completed_with_errors" : "completed") : "processing", completed_at: complete ? new Date().toISOString() : null }).eq("id", input.importId);
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: `${imported} rows imported${failed ? `, ${failed} rejected` : ""}.`, value: imported };
}

import { cache } from "react";
import {
  demoChangelog,
  demoComments,
  demoFeedback,
  demoGraph,
  demoRoadmap,
  demoThemes,
  demoWorkspace,
  getDemoPost,
} from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type {
  ChangelogEntry,
  DuplicateLink,
  FeedbackComment,
  FeedbackImport,
  FeedbackPost,
  FeedbackPageData,
  FeedbackStatus,
  GraphData,
  LinkState,
  RoadmapItem,
  RoadmapStatus,
  Theme,
  ThemeLink,
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
} from "@/lib/types";

const isDemoSlug = (slug: string) => slug === "demo";

function encodeFeedbackCursor(createdAt: string, id: string) {
  return Buffer.from(JSON.stringify([createdAt, id])).toString("base64url");
}

export function decodeFeedbackCursor(cursor?: string) {
  if (!cursor) return null;
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== "string" || typeof value[1] !== "string") return null;
    if (Number.isNaN(Date.parse(value[0])) || !/^[0-9a-f-]{36}$/i.test(value[1])) return null;
    return { createdAt: value[0], id: value[1] };
  } catch {
    return null;
  }
}

export const getWorkspace = cache(async (slug: string): Promise<Workspace | null> => {
  if (isDemoSlug(slug)) return demoWorkspace;
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("workspaces")
    .select("id,name,slug,description,is_public,is_demo")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? "",
    isPublic: data.is_public,
    isDemo: data.is_demo,
  };
});

export const getBoardId = cache(async (slug: string): Promise<string | null> => {
  if (isDemoSlug(slug)) return "22222222-2222-4222-8222-222222222222";
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase) return null;
  const { data } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("is_public", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
});

export async function getFeedbackPage(slug: string, options: {
  query?: string;
  status?: FeedbackStatus;
  cursor?: string;
  pageSize?: number;
} = {}): Promise<FeedbackPageData> {
  if (isDemoSlug(slug)) return { posts: demoFeedback };
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase) return { posts: [] };
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 20, 49));
  const cursor = decodeFeedbackCursor(options.cursor);
  const { data, error } = await supabase.rpc("list_feedback", {
    p_workspace_id: workspace.id,
    p_query: options.query?.trim() || undefined,
    p_status: options.status,
    p_cursor_created_at: cursor?.createdAt,
    p_cursor_id: cursor?.id,
    p_limit: pageSize + 1,
  });

  if (error || !data) return { posts: [] };
  const visibleRows = data.slice(0, pageSize);
  const posts = visibleRows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    body: row.body,
    authorName: row.author_name ?? "Customer",
    authorInitials: row.author_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CU",
    source: row.source,
    status: row.status,
    votes: Number(row.vote_count ?? 0),
    comments: Number(row.comment_count ?? 0),
    createdAt: row.created_at,
    themeId: row.confirmed_theme_id || undefined,
    embeddingState: row.embedding_state,
    visibility: row.visibility,
    duplicateOfId: row.duplicate_of_id || undefined,
    canonicalTitle: row.canonical_title || undefined,
    votedByViewer: row.voted_by_viewer,
  }));
  const last = visibleRows.at(-1);
  return {
    posts,
    nextCursor: data.length > pageSize && last ? encodeFeedbackCursor(last.created_at, last.id) : undefined,
  };
}

export const getFeedback = cache(async (slug: string): Promise<FeedbackPost[]> => {
  const page = await getFeedbackPage(slug, { pageSize: 49 });
  return page.posts;
});

export const getFeedbackPost = cache(
  async (slug: string, id: string): Promise<FeedbackPost | null> => {
    if (isDemoSlug(slug)) return getDemoPost(id) ?? null;
    const workspace = await getWorkspace(slug);
    const supabase = await createClient();
    if (!workspace || !supabase) return null;
    const { data, error } = await supabase.rpc("get_feedback_detail", {
      p_workspace_id: workspace.id,
      p_feedback_id: id,
    });
    const row = data?.[0];
    if (error || !row) return null;
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      title: row.title,
      body: row.body,
      authorName: row.author_name,
      authorInitials: row.author_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CU",
      source: row.source,
      status: row.status,
      votes: Number(row.vote_count),
      comments: Number(row.comment_count),
      createdAt: row.created_at,
      themeId: row.confirmed_theme_id || undefined,
      embeddingState: row.embedding_state,
      visibility: row.visibility,
      duplicateOfId: row.duplicate_of_id || undefined,
      canonicalTitle: row.canonical_title || undefined,
      votedByViewer: row.voted_by_viewer,
    };
  },
);

export const getComments = cache(
  async (slug: string, feedbackId: string): Promise<FeedbackComment[]> => {
    if (isDemoSlug(slug)) {
      return demoComments.filter((comment) => comment.feedbackId === feedbackId);
    }
    const workspace = await getWorkspace(slug);
    const supabase = await createClient();
    if (!workspace || !supabase) return [];

    const { data, error } = await supabase
      .from("feedback_comments")
      .select("id,feedback_id,body,created_at,is_staff,author_name_snapshot")
      .eq("workspace_id", workspace.id)
      .eq("feedback_id", feedbackId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data.map((row) => {
      return {
        id: row.id,
        feedbackId: row.feedback_id,
        authorName: row.author_name_snapshot ?? "Customer",
        body: row.body,
        createdAt: row.created_at,
        isStaff: row.is_staff,
      };
    });
  },
);

export const getThemes = cache(async (slug: string): Promise<Theme[]> => {
  if (isDemoSlug(slug)) return demoThemes;
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase) return [];

  const { data, error } = await supabase
    .from("theme_summary")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("signal_count", { ascending: false });

  if (error || !data) return [];
  return data.flatMap((row) => row.id && row.workspace_id && row.name && row.description ? [{
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description,
    signalCount: Number(row.signal_count ?? 0),
    velocity: Number(row.velocity ?? 0),
  }] : []);
});

export const getRoadmap = cache(async (slug: string): Promise<RoadmapItem[]> => {
  if (isDemoSlug(slug)) return demoRoadmap;
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase) return [];

  const { data, error } = await supabase
    .from("roadmap_items")
    .select("id,workspace_id,title,summary,status,target_window,roadmap_theme_links(theme_id)")
    .eq("workspace_id", workspace.id)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  const themeIds = data.flatMap((row) => (row.roadmap_theme_links ?? []).map((link) => link.theme_id));
  const { data: confirmedLinks } = themeIds.length ? await supabase
    .from("feedback_theme_links")
    .select("feedback_id,theme_id")
    .eq("workspace_id", workspace.id)
    .eq("state", "confirmed")
    .in("theme_id", themeIds) : { data: [] };
  return data.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    summary: row.summary,
    status: row.status as RoadmapStatus,
    targetWindow: row.target_window,
    themeIds: (row.roadmap_theme_links ?? []).map((link) => link.theme_id),
    feedbackCount: new Set((confirmedLinks ?? []).filter((link) => (row.roadmap_theme_links ?? []).some((theme) => theme.theme_id === link.theme_id)).map((link) => link.feedback_id)).size,
  }));
});

export const getDuplicateLinks = cache(async (slug: string): Promise<DuplicateLink[]> => {
  if (isDemoSlug(slug)) return [];
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase) return [];
  const { data } = await supabase.from("feedback_duplicate_links").select("id,feedback_id,duplicate_id,state,similarity").eq("workspace_id", workspace.id).neq("state", "rejected");
  return (data ?? []).map((row) => ({ id: row.id, feedbackId: row.feedback_id, duplicateId: row.duplicate_id, state: row.state, similarity: Number(row.similarity) }));
});

export const getAdminChangelog = cache(async (slug: string): Promise<ChangelogEntry[]> => {
  if (isDemoSlug(slug)) return demoChangelog;
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase) return [];
  const { data } = await supabase.from("changelog_entries").select("id,roadmap_item_id,title,body,published_at").eq("workspace_id", workspace.id).order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({ id: row.id, roadmapItemId: row.roadmap_item_id ?? undefined, title: row.title, body: row.body, publishedAt: row.published_at ?? undefined }));
});

export const getWorkspaceMembers = cache(async (slug: string): Promise<WorkspaceMember[]> => {
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase || workspace.isDemo) return [];
  const { data: memberships } = await supabase.from("workspace_members").select("user_id,role,created_at").eq("workspace_id", workspace.id).order("created_at");
  const ids = (memberships ?? []).map((member) => member.user_id);
  const { data: profiles } = ids.length ? await supabase.from("profiles").select("id,display_name,avatar_url").in("id", ids) : { data: [] };
  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return (memberships ?? []).map((member) => ({ userId: member.user_id, displayName: byId.get(member.user_id)?.display_name ?? "Member", avatarUrl: byId.get(member.user_id)?.avatar_url ?? undefined, role: member.role, joinedAt: member.created_at }));
});

export const getWorkspaceInvitations = cache(async (slug: string): Promise<WorkspaceInvitation[]> => {
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase || workspace.isDemo) return [];
  const { data } = await supabase.from("workspace_invitations").select("id,role,created_at,expires_at,accepted_at,revoked_at").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(20);
  const now = Date.now();
  return (data ?? []).map((invite) => ({ id: invite.id, role: invite.role, createdAt: invite.created_at, expiresAt: invite.expires_at, isActive: !invite.revoked_at && !invite.accepted_at && Date.parse(invite.expires_at) > now, acceptedAt: invite.accepted_at ?? undefined, revokedAt: invite.revoked_at ?? undefined }));
});

export const getFeedbackImports = cache(async (slug: string): Promise<FeedbackImport[]> => {
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase || workspace.isDemo) return [];
  const { data } = await supabase.from("feedback_imports").select("id,filename,state,total_rows,imported_rows,failed_rows,created_at").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(10);
  return (data ?? []).map((item) => ({ id: item.id, filename: item.filename, state: item.state, totalRows: item.total_rows, importedRows: item.imported_rows, failedRows: item.failed_rows, createdAt: item.created_at }));
});

export const getChangelog = cache(async (slug: string): Promise<ChangelogEntry[]> => {
  if (isDemoSlug(slug)) return demoChangelog;
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase) return [];

  const { data, error } = await supabase
    .from("changelog_entries")
    .select("id,roadmap_item_id,title,body,published_at")
    .eq("workspace_id", workspace.id)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    roadmapItemId: row.roadmap_item_id ?? undefined,
    title: row.title,
    body: row.body,
    publishedAt: row.published_at,
  }));
});

export const getGraph = cache(async (slug: string): Promise<GraphData> => {
  if (isDemoSlug(slug)) return demoGraph;
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase) {
    return { feedback: [], themes: [], roadmap: [], links: [] };
  }

  const [feedback, themes, roadmap, linkResult] = await Promise.all([
    getFeedback(slug),
    getThemes(slug),
    getRoadmap(slug),
    supabase
      .from("feedback_theme_links")
      .select("id,feedback_id,theme_id,state,similarity")
      .eq("workspace_id", workspace.id)
      .neq("state", "rejected"),
  ]);

  const links: ThemeLink[] = (linkResult.data ?? []).map((row) => ({
    id: row.id,
    feedbackId: row.feedback_id,
    themeId: row.theme_id,
    state: row.state as LinkState,
    similarity: Number(row.similarity),
  }));

  return { feedback, themes, roadmap, links };
});

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
  FeedbackComment,
  FeedbackPost,
  FeedbackSource,
  FeedbackStatus,
  GraphData,
  LinkState,
  RoadmapItem,
  RoadmapStatus,
  Theme,
  ThemeLink,
  Workspace,
} from "@/lib/types";

const isDemoSlug = (slug: string) => slug === "demo";

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

export const getFeedback = cache(async (slug: string): Promise<FeedbackPost[]> => {
  if (isDemoSlug(slug)) return demoFeedback;
  const workspace = await getWorkspace(slug);
  const supabase = await createClient();
  if (!workspace || !supabase) return [];

  const { data, error } = await supabase
    .from("feedback_feed")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    body: row.body,
    authorName: row.author_name ?? "Customer",
    authorInitials: row.author_initials ?? "CU",
    source: row.source as FeedbackSource,
    status: row.status as FeedbackStatus,
    votes: Number(row.vote_count ?? 0),
    comments: Number(row.comment_count ?? 0),
    createdAt: row.created_at,
    themeId: row.confirmed_theme_id ?? undefined,
    embeddingState: row.embedding_state,
  }));
});

export const getFeedbackPost = cache(
  async (slug: string, id: string): Promise<FeedbackPost | null> => {
    if (isDemoSlug(slug)) return getDemoPost(id) ?? null;
    const rows = await getFeedback(slug);
    return rows.find((post) => post.id === id) ?? null;
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
  return data.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description,
    signalCount: Number(row.signal_count ?? 0),
    velocity: Number(row.velocity ?? 0),
  }));
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
  return data.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    summary: row.summary,
    status: row.status as RoadmapStatus,
    targetWindow: row.target_window,
    themeIds: (row.roadmap_theme_links ?? []).map((link) => link.theme_id),
    feedbackCount: 0,
  }));
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

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ViewerProfile, Workspace, WorkspaceMembership, WorkspaceRole } from "@/lib/types";

export const getViewer = cache(async (): Promise<ViewerProfile | null> => {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: claimsResult, error } = await supabase.auth.getClaims();
  const claims = claimsResult?.claims;
  const userId = claims?.sub;
  if (error || !userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const email = typeof claims.email === "string" ? claims.email : "";
  return {
    id: userId,
    displayName: profile?.display_name ?? email.split("@")[0] ?? "Member",
    avatarUrl: profile?.avatar_url ?? undefined,
    email,
  };
});

export const getViewerWorkspaces = cache(async (): Promise<WorkspaceMembership[]> => {
  const viewer = await getViewer();
  const supabase = await createClient();
  if (!viewer || !supabase) return [];

  const { data } = await supabase
    .from("workspace_members")
    .select("role,workspaces(id,name,slug,description,is_public,is_demo)")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false });

  return (data ?? []).flatMap((membership) => {
    const row = membership.workspaces;
    if (!row || row.is_demo) return [];
    const workspace: Workspace = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      isPublic: row.is_public,
      isDemo: row.is_demo,
    };
    return [{ workspace, role: membership.role as WorkspaceRole }];
  });
});

export async function requireViewer(nextPath: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return viewer;
}

export async function requireWorkspaceMembership(slug: string, nextPath: string) {
  const viewer = await requireViewer(nextPath);
  const memberships = await getViewerWorkspaces();
  const membership = memberships.find((item) => item.workspace.slug === slug);
  if (!membership) notFound();
  return { viewer, memberships, membership };
}

import { InboxClient } from "@/components/product/admin/inbox-client";
import { getBoardId, getDuplicateLinks, getFeedbackImports, getGraph, getWorkspace } from "@/lib/data";

export default async function InboxPage({ params, searchParams }: { params: Promise<{ workspaceSlug: string }>; searchParams: Promise<{ selected?: string }> }) {
  const [{ workspaceSlug }, query] = await Promise.all([params, searchParams]);
  const [workspace, boardId, graph, duplicateLinks, imports] = await Promise.all([getWorkspace(workspaceSlug), getBoardId(workspaceSlug), getGraph(workspaceSlug), getDuplicateLinks(workspaceSlug), getFeedbackImports(workspaceSlug)]);
  return <InboxClient posts={graph.feedback} themes={graph.themes} themeLinks={graph.links} duplicateLinks={duplicateLinks} imports={imports} workspaceSlug={workspaceSlug} workspaceId={workspace?.id} boardId={boardId ?? undefined} initialSelected={query.selected} />;
}

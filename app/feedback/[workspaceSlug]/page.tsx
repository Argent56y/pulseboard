import { notFound } from "next/navigation";
import { PublicBoardScreen } from "@/components/product/public-board-screen";
import { getBoardId, getFeedbackPage, getWorkspace } from "@/lib/data";
import type { FeedbackStatus } from "@/lib/types";

const statuses = new Set<FeedbackStatus>(["new", "under_review", "planned", "in_progress", "shipped", "closed"]);

export default async function FeedbackPage({ params, searchParams }: { params: Promise<{ workspaceSlug: string }>; searchParams: Promise<{ q?: string; status?: string; cursor?: string }> }) {
  const [{ workspaceSlug }, query] = await Promise.all([params, searchParams]);
  const status = query.status && statuses.has(query.status as FeedbackStatus) ? query.status as FeedbackStatus : undefined;
  const [workspace, page, boardId] = await Promise.all([
    getWorkspace(workspaceSlug),
    getFeedbackPage(workspaceSlug, { query: query.q, status, cursor: query.cursor, pageSize: 20 }),
    getBoardId(workspaceSlug),
  ]);
  if (!workspace || !workspace.isPublic || !boardId) notFound();
  return <PublicBoardScreen workspace={workspace} posts={page.posts} boardId={boardId} query={query.q} status={status} nextCursor={page.nextCursor} />;
}

import { PublicBoardScreen } from "@/components/product/public-board-screen";
import { demoFeedback, demoWorkspace } from "@/lib/mock-data";
import type { FeedbackStatus } from "@/lib/types";

const statuses = new Set<FeedbackStatus>(["new", "under_review", "planned", "in_progress", "shipped", "closed"]);

export default async function DemoBoardPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const query = await searchParams;
  const status = query.status && statuses.has(query.status as FeedbackStatus) ? query.status as FeedbackStatus : undefined;
  const term = query.q?.trim().toLowerCase() ?? "";
  const posts = demoFeedback.filter((post) => {
    const matchesTerm = !term || `${post.title} ${post.body} ${post.authorName}`.toLowerCase().includes(term);
    return matchesTerm && (!status || post.status === status);
  });

  return <PublicBoardScreen workspace={demoWorkspace} posts={posts} boardId="22222222-2222-4222-8222-222222222222" query={query.q} status={status} />;
}

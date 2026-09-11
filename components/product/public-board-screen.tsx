import { FeedbackBoard } from "@/components/product/feedback-board";
import { NewFeedbackForm } from "@/components/product/new-feedback-form";
import { PublicHeader } from "@/components/product/public-header";
import { PendingActionReplayer } from "@/components/auth/pending-action-replayer";
import type { FeedbackPost, FeedbackStatus, Workspace } from "@/lib/types";

export function PublicBoardScreen({ workspace, posts, boardId, query, status, nextCursor }: { workspace: Workspace; posts: FeedbackPost[]; boardId: string; query?: string; status?: FeedbackStatus; nextCursor?: string }) {
  return <div className="product-page">
    <PendingActionReplayer />
    <PublicHeader workspace={workspace} active="feedback" />
    <main className="public-shell">
      <header className="public-heading"><div><span className="app-kicker">Customer feedback</span><h1>What should we build next?</h1><p>Share an idea, vote on what matters, and follow the evidence from request to release.</p></div><NewFeedbackForm workspace={workspace} boardId={boardId} /></header>
      <FeedbackBoard workspace={workspace} posts={posts} query={query} status={status} nextCursor={nextCursor} />
    </main>
  </div>;
}

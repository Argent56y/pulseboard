import { FeedbackBoard } from "@/components/product/feedback-board";
import { NewFeedbackForm } from "@/components/product/new-feedback-form";
import { PublicHeader } from "@/components/product/public-header";
import type { FeedbackPost, Workspace } from "@/lib/types";

export function PublicBoardScreen({ workspace, posts, boardId }: { workspace: Workspace; posts: FeedbackPost[]; boardId: string }) {
  return <div className="product-page">
    <PublicHeader workspace={workspace} active="feedback" />
    <main className="public-shell">
      <header className="public-heading"><div><span className="app-kicker">Customer feedback</span><h1>What should we build next?</h1><p>Share an idea, vote on what matters, and follow the evidence from request to release.</p></div><NewFeedbackForm workspace={workspace} boardId={boardId} /></header>
      <FeedbackBoard workspace={workspace} posts={posts} />
    </main>
  </div>;
}

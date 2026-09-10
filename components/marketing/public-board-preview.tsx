import Link from "next/link";
import { ArrowUp, Check, MessageSquare } from "lucide-react";
import { demoFeedback } from "@/lib/mock-data";
import { feedbackStatusLabel } from "@/lib/utils";

export function PublicBoardPreview() {
  const posts = demoFeedback.slice(0, 4);
  return (
    <section className="board-preview-section section-shell" aria-labelledby="board-preview-title">
      <div className="section-index">03 / PUBLIC BOARD</div>
      <div className="board-preview-header">
        <div>
          <p className="eyebrow">Close the loop in public</p>
          <h2 id="board-preview-title">A feedback board people want to return to.</h2>
        </div>
        <Link href="/demo" className="button button-outline">Open Northstar’s board</Link>
      </div>
      <div className="board-preview-list">
        {posts.map((post) => (
          <article key={post.id}>
            <div className="preview-votes"><ArrowUp size={14} /><strong>{post.votes}</strong></div>
            <div>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
            </div>
            <div className="preview-meta">
              <span className={`status status-${post.status}`}>
                {post.status === "shipped" && <Check size={12} />}
                {feedbackStatusLabel(post.status)}
              </span>
              <span><MessageSquare size={13} /> {post.comments}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowUp, Check, MessageSquare } from "lucide-react";
import { demoFeedback } from "@/lib/mock-data";
import { feedbackStatusLabel } from "@/lib/utils";
import { demoFeedbackRu } from "@/lib/mock-data-ru";
import { localizedPath, marketingCopy, type Locale } from "@/lib/i18n";

export function PublicBoardPreview({ locale = "en" }: { locale?: Locale }) {
  const posts = (locale === "ru" ? demoFeedbackRu : demoFeedback).slice(0, 4);
  const copy = marketingCopy[locale];
  return (
    <section className="board-preview-section section-shell" aria-labelledby="board-preview-title">
      <div className="section-index">{copy.boardIndex}</div>
      <div className="board-preview-header">
        <div>
          <p className="eyebrow">{copy.boardEyebrow}</p>
          <h2 id="board-preview-title">{copy.boardTitle}</h2>
        </div>
        <Link href={localizedPath(locale, "/demo")} className="button button-outline">{copy.boardButton}</Link>
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
                {feedbackStatusLabel(post.status, locale)}
              </span>
              <span><MessageSquare size={13} /> {post.comments}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

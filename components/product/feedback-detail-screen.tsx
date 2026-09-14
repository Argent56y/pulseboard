import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { CommentThread } from "@/components/product/comment-thread";
import { PublicHeader } from "@/components/product/public-header";
import { VoteButton } from "@/components/product/vote-button";
import { PendingActionReplayer } from "@/components/auth/pending-action-replayer";
import type { FeedbackComment, FeedbackPost, Workspace } from "@/lib/types";
import { feedbackStatusLabel, formatDate, sourceLabel } from "@/lib/utils";
import { localizedPath, type Locale } from "@/lib/i18n";

export function FeedbackDetailScreen({ workspace, post, comments, locale = "en" }: { workspace: Workspace; post: FeedbackPost; comments: FeedbackComment[]; locale?: Locale }) {
  const root = localizedPath(locale, workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`);
  return <div className="product-page" lang={locale}><PendingActionReplayer /><PublicHeader workspace={workspace} active="feedback" locale={locale} /><main className="public-shell feedback-detail"><Link className="back-link" href={root}><ArrowLeft size={14} /> {locale === "ru" ? "Все отзывы" : "Back to all feedback"}</Link><article className="feedback-detail-main">{post.visibility === "merged" ? <div className="vote-button vote-button-merged">↳</div> : <VoteButton post={post} readOnly={workspace.isDemo} locale={locale} />}<div><div className="feedback-detail-meta"><span className={`status status-${post.status}`}>{feedbackStatusLabel(post.status, locale)}</span><span>{sourceLabel(post.source, locale)}</span><span>{formatDate(post.createdAt, locale)}</span></div><h1 style={{ viewTransitionName: `feedback-title-${post.id}` }}>{post.title}</h1><p>{post.body}</p>{post.visibility === "merged" && post.duplicateOfId && <Link className="canonical-link" href={`${root}/post/${post.duplicateOfId}`}>{locale === "ru" ? "Идея объединена с основным запросом" : "This idea was merged into"} “{post.canonicalTitle ?? (locale === "ru" ? "основной запрос" : "the canonical request")}” →</Link>}<footer><span>{post.authorInitials}</span><strong>{post.authorName}</strong><small><MessageSquare size={12} /> {comments.length} {locale === "ru" ? "комментариев" : "comments"}</small></footer></div></article><CommentThread feedbackId={post.id} comments={comments} readOnly={workspace.isDemo || post.visibility === "merged"} locale={locale} /></main></div>;
}

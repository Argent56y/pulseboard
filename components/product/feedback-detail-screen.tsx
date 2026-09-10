import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { CommentThread } from "@/components/product/comment-thread";
import { PublicHeader } from "@/components/product/public-header";
import { VoteButton } from "@/components/product/vote-button";
import type { FeedbackComment, FeedbackPost, Workspace } from "@/lib/types";
import { feedbackStatusLabel, formatDate, sourceLabel } from "@/lib/utils";

export function FeedbackDetailScreen({ workspace, post, comments }: { workspace: Workspace; post: FeedbackPost; comments: FeedbackComment[] }) {
  const root = workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`;
  return <div className="product-page"><PublicHeader workspace={workspace} active="feedback" /><main className="public-shell feedback-detail"><Link className="back-link" href={root}><ArrowLeft size={14} /> Back to all feedback</Link><article className="feedback-detail-main"><VoteButton post={post} readOnly={workspace.isDemo} /><div><div className="feedback-detail-meta"><span className={`status status-${post.status}`}>{feedbackStatusLabel(post.status)}</span><span>{sourceLabel(post.source)}</span><span>{formatDate(post.createdAt)}</span></div><h1>{post.title}</h1><p>{post.body}</p><footer><span>{post.authorInitials}</span><strong>{post.authorName}</strong><small><MessageSquare size={12} /> {comments.length} comments</small></footer></div></article><CommentThread feedbackId={post.id} comments={comments} readOnly={workspace.isDemo} /></main></div>;
}

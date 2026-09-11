import Link from "next/link";
import { MessageSquare, Search, SlidersHorizontal } from "lucide-react";
import { VoteButton } from "@/components/product/vote-button";
import { FeedbackTransitionLink } from "@/components/product/feedback-transition-link";
import type { FeedbackPost, FeedbackStatus, Workspace } from "@/lib/types";
import { feedbackStatusLabel, formatDate, sourceLabel } from "@/lib/utils";

interface FeedbackBoardProps {
  workspace: Workspace;
  posts: FeedbackPost[];
  query?: string;
  status?: FeedbackStatus;
  nextCursor?: string;
}

export function FeedbackBoard({ workspace, posts, query = "", status, nextCursor }: FeedbackBoardProps) {
  const root = workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`;
  const publicPosts = posts.filter((post) => post.visibility !== "hidden");
  const nextParams = new URLSearchParams();
  if (query) nextParams.set("q", query);
  if (status) nextParams.set("status", status);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return <>
    <form className="public-controls" action={root}>
      <label className="search-field"><Search size={16} aria-hidden="true" /><span className="sr-only">Search feedback</span><input name="q" defaultValue={query} placeholder="Search feedback" /></label>
      <SlidersHorizontal size={15} aria-hidden="true" />
      <select className="filter-select" name="status" defaultValue={status ?? "all"} aria-label="Filter by status">
        <option value="all">All statuses</option><option value="new">New</option><option value="under_review">Under review</option><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="shipped">Shipped</option><option value="closed">Closed</option>
      </select>
      <button className="button button-small button-outline" type="submit">Apply</button>
      {(query || status) && <Link className="clear-filters" href={root}>Clear</Link>}
    </form>

    <div className="public-feedback-list" aria-live="polite">
      {publicPosts.length ? publicPosts.map((post) => <article className={`feedback-row ${post.visibility === "merged" ? "feedback-row-merged" : ""}`} key={post.id}>
        {post.visibility === "merged" ? <div className="vote-button vote-button-merged" aria-label="Merged idea">↳</div> : <VoteButton post={post} readOnly={workspace.isDemo} />}
        <div>
          <FeedbackTransitionLink href={`${root}/post/${post.id}`}><h2 style={{ viewTransitionName: `feedback-title-${post.id}` }}>{post.title}</h2></FeedbackTransitionLink>
          <p>{post.body}</p>
          {post.visibility === "merged" && post.duplicateOfId && <Link className="canonical-link" href={`${root}/post/${post.duplicateOfId}`}>Merged into “{post.canonicalTitle ?? "canonical idea"}” →</Link>}
          <div className="feedback-row-meta"><span>{post.authorInitials} · {post.authorName}</span><span>{sourceLabel(post.source)}</span><span>{formatDate(post.createdAt)}</span><span><MessageSquare size={12} /> {post.comments}</span></div>
        </div>
        <span className={`status status-${post.status}`}>{feedbackStatusLabel(post.status)}</span>
      </article>) : <div className="empty-state"><strong>No feedback in this view.</strong><span>Try a broader search or be the first to suggest an idea.</span></div>}
    </div>
    {nextCursor && <div className="pagination-row"><Link className="button button-outline" href={`${root}?${nextParams.toString()}`}>Load older feedback</Link></div>}
  </>;
}

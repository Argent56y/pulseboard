"use client";

import Link from "next/link";
import { MessageSquare, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { VoteButton } from "@/components/product/vote-button";
import type { FeedbackPost, FeedbackStatus, Workspace } from "@/lib/types";
import { feedbackStatusLabel, formatDate, sourceLabel } from "@/lib/utils";

interface FeedbackBoardProps {
  workspace: Workspace;
  posts: FeedbackPost[];
}

export function FeedbackBoard({ workspace, posts }: FeedbackBoardProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const root = workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`;
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return posts.filter((post) => {
      const matchesQuery = `${post.title} ${post.body}`.toLowerCase().includes(normalized);
      const matchesStatus = status === "all" || post.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [posts, query, status]);

  return (
    <>
      <div className="public-controls">
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search feedback</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search feedback"
          />
        </label>
        <SlidersHorizontal size={15} aria-hidden="true" />
        <select
          className="filter-select"
          value={status}
          onChange={(event) => setStatus(event.target.value as FeedbackStatus | "all")}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="under_review">Under review</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="shipped">Shipped</option>
        </select>
      </div>

      <div className="public-feedback-list" aria-live="polite">
        {filtered.length ? filtered.map((post) => (
          <article className="feedback-row" key={post.id}>
            <VoteButton post={post} readOnly={workspace.isDemo} />
            <div>
              <Link href={`${root}/post/${post.id}`}>
                <h2>{post.title}</h2>
              </Link>
              <p>{post.body}</p>
              <div className="feedback-row-meta">
                <span>{post.authorInitials} · {post.authorName}</span>
                <span>{sourceLabel(post.source)}</span>
                <span>{formatDate(post.createdAt)}</span>
                <span><MessageSquare size={12} /> {post.comments}</span>
              </div>
            </div>
            <span className={`status status-${post.status}`}>{feedbackStatusLabel(post.status)}</span>
          </article>
        )) : (
          <div className="empty-state">No feedback matches this view.</div>
        )}
      </div>
    </>
  );
}

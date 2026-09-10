"use client";

import { Search, Sparkles } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { updateFeedbackStatus } from "@/app/actions";
import type { FeedbackPost, FeedbackSource, FeedbackStatus } from "@/lib/types";
import { feedbackStatusLabel, formatDate, sourceLabel } from "@/lib/utils";

interface InboxClientProps {
  posts: FeedbackPost[];
  readOnly?: boolean;
}

const statuses: FeedbackStatus[] = ["new", "under_review", "planned", "in_progress", "shipped", "closed"];

export function InboxClient({ posts, readOnly = false }: InboxClientProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [source, setSource] = useState<FeedbackSource | "all">("all");
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();
  const filtered = useMemo(() => posts.filter((post) => {
    const matchQuery = `${post.title} ${post.body} ${post.authorName}`.toLowerCase().includes(query.toLowerCase());
    return matchQuery && (status === "all" || post.status === status) && (source === "all" || post.source === source);
  }), [posts, query, source, status]);

  const newCount = posts.filter((post) => post.status === "new").length;
  const readyCount = posts.filter((post) => post.embeddingState === "ready").length;
  const plannedCount = posts.filter((post) => ["planned", "in_progress"].includes(post.status)).length;
  const totalVotes = posts.reduce((sum, post) => sum + post.votes, 0);

  function changeStatus(feedbackId: string, nextStatus: FeedbackStatus) {
    if (readOnly) {
      setNotice("This demo is read-only. Create a workspace to triage your own feedback.");
      return;
    }
    startTransition(async () => {
      const result = await updateFeedbackStatus({ feedbackId, status: nextStatus });
      setNotice(result.message);
    });
  }

  return (
    <>
      <section className="kpi-strip" aria-label="Inbox summary">
        <div className="kpi-item"><span>Untriaged</span><strong>{newCount}</strong><small>needs review</small></div>
        <div className="kpi-item"><span>Analyzed</span><strong>{readyCount}</strong><small>semantic ready</small></div>
        <div className="kpi-item"><span>In direction</span><strong>{plannedCount}</strong><small>roadmap linked</small></div>
        <div className="kpi-item"><span>Customer votes</span><strong>{totalVotes}</strong><small>across signals</small></div>
      </section>
      <section className="app-section">
        <div className="section-toolbar">
          <div>
            <h2>Customer signals</h2>
            <p>Review raw feedback, then turn the useful patterns into evidence.</p>
          </div>
          <span className="table-count">{filtered.length} of {posts.length}</span>
        </div>

        <div className="table-toolbar" role="toolbar" aria-label="Feedback filters">
          <label className="app-search">
            <Search size={14} aria-hidden="true" />
            <span className="sr-only">Search inbox</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, message or customer" />
          </label>
          <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus | "all")} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {statuses.map((value) => <option value={value} key={value}>{feedbackStatusLabel(value)}</option>)}
          </select>
          <select className="filter-select" value={source} onChange={(event) => setSource(event.target.value as FeedbackSource | "all")} aria-label="Filter by source">
            <option value="all">All sources</option>
            {(["portal", "email", "interview", "support"] as FeedbackSource[]).map((value) => <option value={value} key={value}>{sourceLabel(value)}</option>)}
          </select>
          {(query || status !== "all" || source !== "all") && (
            <button className="button button-small button-outline" type="button" onClick={() => { setQuery(""); setStatus("all"); setSource("all"); }}>Reset</button>
          )}
        </div>
        {notice && <p className="inline-notice" role="status">{notice}</p>}

        <div className="table-wrap">
          <table className="app-table">
            <thead><tr><th>Signal</th><th>Source</th><th>Reach</th><th>Analysis</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id}>
                  <td><span className="table-title">{post.title}</span><span className="table-subtitle">{post.body}</span></td>
                  <td><span className="source-label">{sourceLabel(post.source)}</span></td>
                  <td>{post.votes} votes</td>
                  <td>
                    <span className={`analysis-state analysis-${post.embeddingState}`}>
                      <Sparkles size={11} /> {post.embeddingState}
                    </span>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={post.status}
                      disabled={isPending}
                      onChange={(event) => changeStatus(post.id, event.target.value as FeedbackStatus)}
                      aria-label={`Status for ${post.title}`}
                    >
                      {statuses.map((value) => <option value={value} key={value}>{feedbackStatusLabel(value)}</option>)}
                    </select>
                  </td>
                  <td>{formatDate(post.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="empty-state">No signals match these filters.</div>}
        </div>
      </section>
    </>
  );
}

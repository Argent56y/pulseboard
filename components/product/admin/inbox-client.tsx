"use client";

import { Archive, Check, ExternalLink, FileUp, Link2, RotateCcw, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { linkFeedbackToTheme, moderateFeedback, retryFeedbackAnalysis, reviewDuplicateSuggestion, reviewSuggestion, updateFeedbackStatus } from "@/app/actions";
import { CsvImporter } from "@/components/product/admin/csv-importer";
import type { DuplicateLink, FeedbackImport, FeedbackPost, FeedbackSource, FeedbackStatus, Theme, ThemeLink } from "@/lib/types";
import { feedbackStatusLabel, formatDate, sourceLabel } from "@/lib/utils";

interface InboxClientProps {
  posts: FeedbackPost[];
  themes?: Theme[];
  themeLinks?: ThemeLink[];
  duplicateLinks?: DuplicateLink[];
  imports?: FeedbackImport[];
  workspaceSlug?: string;
  workspaceId?: string;
  boardId?: string;
  initialSelected?: string;
  readOnly?: boolean;
}

const statuses: FeedbackStatus[] = ["new", "under_review", "planned", "in_progress", "shipped", "closed"];
const sources: FeedbackSource[] = ["portal", "email", "interview", "support", "manual", "csv"];
const analysisLabel = { pending: "Queued", ready: "Ready", failed: "Failed" } as const;

export function InboxClient({ posts, themes = [], themeLinks = [], duplicateLinks = [], imports = [], workspaceSlug = "demo", workspaceId, boardId, initialSelected, readOnly = false }: InboxClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [source, setSource] = useState<FeedbackSource | "all">("all");
  const [selectedId, setSelectedId] = useState(initialSelected ?? posts[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [manualTheme, setManualTheme] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => posts.filter((post) => {
    const matchQuery = `${post.title} ${post.body} ${post.authorName}`.toLowerCase().includes(query.toLowerCase());
    return matchQuery && (status === "all" || post.status === status) && (source === "all" || post.source === source);
  }), [posts, query, source, status]);
  const selected = posts.find((post) => post.id === selectedId);
  const selectedThemeLinks = themeLinks.filter((link) => link.feedbackId === selectedId && link.state !== "rejected" && (selected?.embeddingState === "ready" || link.state === "confirmed"));
  const selectedDuplicates = duplicateLinks.filter((link) => link.feedbackId === selectedId && link.state !== "rejected" && selected?.embeddingState === "ready");

  const newCount = posts.filter((post) => post.status === "new" && post.visibility !== "hidden").length;
  const readyCount = posts.filter((post) => post.embeddingState === "ready").length;
  const plannedCount = posts.filter((post) => ["planned", "in_progress"].includes(post.status)).length;
  const totalVotes = posts.reduce((sum, post) => sum + post.votes, 0);

  function run(task: () => Promise<{ message: string }>) {
    if (readOnly) { setNotice("This demo is read-only. Create a workspace to triage your own feedback."); return; }
    startTransition(async () => { const result = await task(); setNotice(result.message); router.refresh(); });
  }

  return <>
    <section className="kpi-strip" aria-label="Inbox summary">
      <div className="kpi-item"><span>Untriaged</span><strong>{newCount}</strong><small>needs review</small></div>
      <div className="kpi-item"><span>Analyzed</span><strong>{readyCount}</strong><small>semantic ready</small></div>
      <div className="kpi-item"><span>In direction</span><strong>{plannedCount}</strong><small>roadmap linked</small></div>
      <div className="kpi-item"><span>Customer votes</span><strong>{totalVotes}</strong><small>across signals</small></div>
    </section>
    <section className="app-section inbox-layout">
      <div className="inbox-table-pane">
        <div className="section-toolbar"><div><h2>Customer signals</h2><p>Review raw feedback, then turn useful patterns into evidence.</p></div><div className="toolbar-actions">{!readOnly && <button className="button button-small button-outline" type="button" onClick={() => setShowImport(true)}><FileUp size={13} /> Import CSV</button>}<span className="table-count">{filtered.length} of {posts.length}</span></div></div>
        <div className="table-toolbar" role="toolbar" aria-label="Feedback filters"><label className="app-search"><Search size={14} /><span className="sr-only">Search inbox</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, message or customer" /></label><select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus | "all")} aria-label="Filter by status"><option value="all">All statuses</option>{statuses.map((value) => <option value={value} key={value}>{feedbackStatusLabel(value)}</option>)}</select><select className="filter-select" value={source} onChange={(event) => setSource(event.target.value as FeedbackSource | "all")} aria-label="Filter by source"><option value="all">All sources</option>{sources.map((value) => <option value={value} key={value}>{sourceLabel(value)}</option>)}</select></div>
        {notice && <p className="inline-notice" role="status">{notice}</p>}
        <div className="table-wrap"><table className="app-table"><thead><tr><th>Signal</th><th>Source</th><th>Reach</th><th>Analysis</th><th>Status</th><th>Date</th></tr></thead><tbody>{filtered.map((post) => <tr key={post.id} data-selected={post.id === selectedId} data-visibility={post.visibility} onClick={() => setSelectedId(post.id)}><td><button className="table-title-button" type="button" onClick={() => setSelectedId(post.id)}><span className="table-title">{post.title}</span><span className="table-subtitle">{post.body}</span></button></td><td><span className="source-label">{sourceLabel(post.source)}</span></td><td>{post.votes} votes · {post.comments} comments</td><td><span className={`analysis-state analysis-${post.embeddingState}`}><Sparkles size={12} /> {analysisLabel[post.embeddingState]}</span></td><td><select className="status-select" value={post.status} disabled={isPending || readOnly} onClick={(event) => event.stopPropagation()} onChange={(event) => run(() => updateFeedbackStatus({ feedbackId: post.id, status: event.target.value }))} aria-label={`Status for ${post.title}`}>{statuses.map((value) => <option value={value} key={value}>{feedbackStatusLabel(value)}</option>)}</select></td><td>{formatDate(post.createdAt)}</td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state"><strong>No signals match these filters.</strong><span>Reset the filters or import a customer feedback CSV.</span></div>}</div>
        {imports.length > 0 && <div className="recent-imports"><span className="app-kicker">Recent imports</span>{imports.slice(0, 3).map((item) => <div key={item.id}><span className={`import-state-dot import-state-${item.state}`} /><strong>{item.filename}</strong><span>{item.importedRows} added{item.failedRows ? ` · ${item.failedRows} skipped` : ""} · {item.state.replaceAll("_", " ")}</span></div>)}</div>}
      </div>
      <aside className="inbox-inspector" aria-label="Feedback inspector">{selected ? <>
        <header><div><span className="app-kicker">Customer signal</span><h2>{selected.title}</h2></div><Link href={`/feedback/${workspaceSlug}/post/${selected.id}`} aria-label="Open public feedback"><ExternalLink size={15} /></Link></header>
        <p className="inspector-quote">“{selected.body}”</p><div className="inspector-meta"><div><span>Customer</span><strong>{selected.authorName}</strong></div><div><span>Reach</span><strong>{selected.votes} votes · {selected.comments} comments</strong></div><div><span>Source</span><strong>{sourceLabel(selected.source)}</strong></div><div><span>Visibility</span><strong>{selected.visibility ?? "published"}</strong></div></div>
        <div className={`analysis-callout analysis-callout-${selected.embeddingState}`} aria-live="polite"><Sparkles size={14} /><div><strong>{selected.embeddingState === "ready" ? "Analysis complete" : selected.embeddingState === "pending" ? "Analysis queued" : "Analysis needs attention"}</strong><span>{selected.embeddingState === "ready" ? "Strong matches are ready for founder review." : selected.embeddingState === "pending" ? "The worker is preparing theme and duplicate suggestions." : "The feedback remains available. Retry the analysis when ready."}</span></div>{selected.embeddingState === "failed" && <button className="button button-small button-outline" disabled={isPending} type="button" onClick={() => run(() => retryFeedbackAnalysis(selected.id))}><RotateCcw size={13} /> Retry</button>}</div>
        <section className="inspector-section"><h3>Theme suggestions</h3>{selectedThemeLinks.map((link) => { const theme = themes.find((item) => item.id === link.themeId); return <div className="suggestion-row" key={link.id}><div><strong>{theme?.name ?? "Theme"}</strong><span>{Math.round(link.similarity * 100)}% match · {link.state}</span></div>{link.state === "suggested" && <span className="suggestion-actions"><button type="button" disabled={isPending} onClick={() => run(() => reviewSuggestion({ linkId: link.id, state: "confirmed" }))} aria-label="Confirm theme"><Check size={13} /></button><button type="button" disabled={isPending} onClick={() => run(() => reviewSuggestion({ linkId: link.id, state: "rejected" }))} aria-label="Reject theme"><X size={13} /></button></span>}</div>; })}{!selectedThemeLinks.length && <p className="form-hint">{selected.embeddingState === "pending" ? "Suggestions will appear after analysis." : selected.embeddingState === "failed" ? "Retry analysis or link this signal manually." : "No strong theme match was found. Link manually if needed."}</p>}<div className="manual-link"><select value={manualTheme} onChange={(event) => setManualTheme(event.target.value)}><option value="">Choose a theme</option>{themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select><button type="button" disabled={!manualTheme || isPending} onClick={() => run(() => linkFeedbackToTheme({ feedbackId: selected.id, themeId: manualTheme }))}><Link2 size={13} /> Link</button></div></section>
        <section className="inspector-section"><h3>Duplicate suggestions</h3>{selectedDuplicates.map((link) => { const duplicate = posts.find((post) => post.id === link.duplicateId); return <div className="suggestion-row" key={link.id}><div><strong>{duplicate?.title ?? "Existing feedback"}</strong><span>{Math.round(link.similarity * 100)}% match · {link.state}</span></div>{link.state === "suggested" && <span className="suggestion-actions"><button type="button" disabled={isPending} onClick={() => run(() => reviewDuplicateSuggestion({ linkId: link.id, state: "confirmed" }))} aria-label="Merge duplicate"><Check size={13} /></button><button type="button" disabled={isPending} onClick={() => run(() => reviewDuplicateSuggestion({ linkId: link.id, state: "rejected" }))} aria-label="Reject duplicate"><X size={13} /></button></span>}</div>; })}{!selectedDuplicates.length && <p className="form-hint">{selected.embeddingState === "ready" ? "No likely duplicate passed the 86% threshold." : "Duplicate checks follow semantic analysis."}</p>}</section>
        <footer className="inspector-footer"><button className="button button-small button-outline" disabled={isPending || readOnly} type="button" onClick={() => run(() => moderateFeedback({ feedbackId: selected.id, visibility: selected.visibility === "hidden" ? "published" : "hidden" }))}><Archive size={13} /> {selected.visibility === "hidden" ? "Publish again" : "Hide as spam"}</button></footer>
      </> : <div className="inspector-empty">Select a feedback row to inspect its evidence and moderation state.</div>}</aside>
    </section>
    {showImport && workspaceId && boardId && <CsvImporter workspaceId={workspaceId} boardId={boardId} onClose={() => { setShowImport(false); router.refresh(); }} />}
  </>;
}

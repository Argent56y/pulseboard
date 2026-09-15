"use client";

import { Archive, Check, ExternalLink, FileUp, Link2, RotateCcw, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { linkFeedbackToTheme, moderateFeedback, retryFeedbackAnalysis, reviewDuplicateSuggestion, reviewSuggestion, updateFeedbackStatus } from "@/app/actions";
import { CsvImporter } from "@/components/product/admin/csv-importer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import type { DuplicateLink, FeedbackImport, FeedbackPost, FeedbackSource, FeedbackStatus, Theme, ThemeLink } from "@/lib/types";
import { feedbackStatusLabel, formatDate, sourceLabel } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

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
  locale?: Locale;
}

const statuses: FeedbackStatus[] = ["new", "under_review", "planned", "in_progress", "shipped", "closed"];
const sources: FeedbackSource[] = ["portal", "email", "interview", "support", "manual", "csv"];
export function InboxClient({ posts, themes = [], themeLinks = [], duplicateLinks = [], imports = [], workspaceSlug = "demo", workspaceId, boardId, initialSelected, readOnly = false, locale = "en" }: InboxClientProps) {
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
  const selected = filtered.find((post) => post.id === selectedId) ?? filtered[0];
  const selectedThemeLinks = themeLinks.filter((link) => link.feedbackId === selected?.id && link.state !== "rejected" && (selected?.embeddingState === "ready" || link.state === "confirmed"));
  const selectedDuplicates = duplicateLinks.filter((link) => link.feedbackId === selected?.id && link.state !== "rejected" && selected?.embeddingState === "ready");

  const newCount = posts.filter((post) => post.status === "new" && post.visibility !== "hidden").length;
  const readyCount = posts.filter((post) => post.embeddingState === "ready").length;
  const plannedCount = posts.filter((post) => ["planned", "in_progress"].includes(post.status)).length;
  const totalVotes = posts.reduce((sum, post) => sum + post.votes, 0);

  const copy = locale === "ru" ? {
    summary: "Сводка входящих отзывов",
    untriaged: "Без разбора", review: "требуют внимания",
    analyzed: "Проанализировано", semantic: "семантика готова",
    direction: "В roadmap", linked: "связаны с решением",
    votes: "Голоса клиентов", across: "по всем сигналам",
    heading: "Сигналы клиентов", description: "Разберите исходные отзывы и превратите закономерности в проверяемые доказательства.",
    import: "Импорт CSV", fictional: "вымышленные данные", search: "Поиск по заголовку, сообщению или клиенту",
    allStatuses: "Все статусы", allSources: "Все источники", reset: "Сбросить",
    signal: "Сигнал", source: "Источник", reach: "Охват", analysis: "Анализ", status: "Статус", date: "Дата",
    queued: "В очереди", ready: "Готово", failed: "Ошибка", voteWord: "голосов", commentWord: "комментариев",
    empty: "Нет отзывов с такими фильтрами.", emptyHint: "Сбросьте фильтры или измените поисковый запрос.",
    recent: "Недавние импорты", added: "добавлено", skipped: "пропущено",
    inspector: "Панель отзыва", customerSignal: "Отзыв клиента", openPublic: "Открыть публичный отзыв",
    customer: "Клиент", visibility: "Видимость", published: "опубликовано",
    complete: "Анализ завершён", completeBody: "Сильные совпадения готовы к проверке.",
    pending: "Анализ в очереди", pendingBody: "Система готовит темы и возможные дубликаты.",
    attention: "Нужно повторить анализ", attentionBody: "Отзыв доступен, даже если AI-анализ завершился с ошибкой.", retry: "Повторить",
    themes: "Предложения тем", theme: "Тема", match: "совпадение", pendingThemes: "Предложения появятся после анализа.", failedThemes: "Повторите анализ или свяжите отзыв вручную.", noThemes: "Сильных совпадений нет. При необходимости свяжите отзыв вручную.", chooseTheme: "Выберите тему", link: "Связать",
    duplicates: "Возможные дубликаты", existing: "Существующий отзыв", merge: "Объединить дубликат", rejectDuplicate: "Отклонить дубликат", noDuplicates: "Ни один дубликат не превысил порог 86%.", duplicatePending: "Проверка дубликатов начнётся после анализа.",
    publishAgain: "Опубликовать снова", hideSpam: "Скрыть как спам", select: "Выберите отзыв, чтобы увидеть доказательства и состояние модерации.",
    readOnly: "Демо доступно только для чтения. Создайте workspace, чтобы работать со своими отзывами.",
  } : {
    summary: "Inbox summary",
    untriaged: "Untriaged", review: "needs review",
    analyzed: "Analyzed", semantic: "semantic ready",
    direction: "In direction", linked: "roadmap linked",
    votes: "Customer votes", across: "across signals",
    heading: "Customer signals", description: "Review raw feedback, then turn useful patterns into evidence.",
    import: "Import CSV", fictional: "sample data", search: "Search title, message or customer",
    allStatuses: "All statuses", allSources: "All sources", reset: "Reset",
    signal: "Signal", source: "Source", reach: "Reach", analysis: "Analysis", status: "Status", date: "Date",
    queued: "Queued", ready: "Ready", failed: "Failed", voteWord: "votes", commentWord: "comments",
    empty: "No signals match these filters.", emptyHint: "Reset the filters or try a broader search.",
    recent: "Recent imports", added: "added", skipped: "skipped",
    inspector: "Feedback inspector", customerSignal: "Customer signal", openPublic: "Open public feedback",
    customer: "Customer", visibility: "Visibility", published: "published",
    complete: "Analysis complete", completeBody: "Strong matches are ready for founder review.",
    pending: "Analysis queued", pendingBody: "The worker is preparing theme and duplicate suggestions.",
    attention: "Analysis needs attention", attentionBody: "The feedback remains available. Retry the analysis when ready.", retry: "Retry",
    themes: "Theme suggestions", theme: "Theme", match: "match", pendingThemes: "Suggestions will appear after analysis.", failedThemes: "Retry analysis or link this signal manually.", noThemes: "No strong theme match was found. Link manually if needed.", chooseTheme: "Choose a theme", link: "Link",
    duplicates: "Duplicate suggestions", existing: "Existing feedback", merge: "Merge duplicate", rejectDuplicate: "Reject duplicate", noDuplicates: "No likely duplicate passed the 86% threshold.", duplicatePending: "Duplicate checks follow semantic analysis.",
    publishAgain: "Publish again", hideSpam: "Hide as spam", select: "Select a feedback row to inspect its evidence and moderation state.",
    readOnly: "This demo is read-only. Create a workspace to triage your own feedback.",
  };

  const analysisLabel = { pending: copy.queued, ready: copy.ready, failed: copy.failed } as const;

  function run(task: () => Promise<{ message: string }>) {
    if (readOnly) { setNotice(copy.readOnly); return; }
    startTransition(async () => { const result = await task(); setNotice(result.message); router.refresh(); });
  }

  return <>
    <section className="kpi-strip" aria-label={copy.summary}>
      <div className="kpi-item"><span>{copy.untriaged}</span><AnimatedNumber value={newCount} /><small>{copy.review}</small></div>
      <div className="kpi-item"><span>{copy.analyzed}</span><AnimatedNumber value={readyCount} /><small>{copy.semantic}</small></div>
      <div className="kpi-item"><span>{copy.direction}</span><AnimatedNumber value={plannedCount} /><small>{copy.linked}</small></div>
      <div className="kpi-item"><span>{copy.votes}</span><AnimatedNumber value={totalVotes} /><small>{copy.across}</small></div>
    </section>

    <section className="app-section inbox-layout">
      <div className="inbox-table-pane">
        <div className="section-toolbar">
          <div><h2>{copy.heading}</h2><p>{copy.description}</p></div>
          <div className="toolbar-actions">
            {!readOnly && <button className="button button-small button-outline" type="button" onClick={() => setShowImport(true)}><FileUp size={13} /> {copy.import}</button>}
            <span className="table-count">{readOnly && `${copy.fictional} · `}{filtered.length} / {posts.length}</span>
          </div>
        </div>

        <div className="table-toolbar" role="toolbar" aria-label={locale === "ru" ? "Фильтры отзывов" : "Feedback filters"}>
          <label className="app-search"><Search size={14} /><span className="sr-only">{copy.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label>
          <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus | "all")} aria-label={locale === "ru" ? "Фильтр по статусу" : "Filter by status"}><option value="all">{copy.allStatuses}</option>{statuses.map((value) => <option value={value} key={value}>{feedbackStatusLabel(value, locale)}</option>)}</select>
          <select className="filter-select" value={source} onChange={(event) => setSource(event.target.value as FeedbackSource | "all")} aria-label={locale === "ru" ? "Фильтр по источнику" : "Filter by source"}><option value="all">{copy.allSources}</option>{sources.map((value) => <option value={value} key={value}>{sourceLabel(value, locale)}</option>)}</select>
          {(query || status !== "all" || source !== "all") && <button className="filter-reset" type="button" onClick={() => { setQuery(""); setStatus("all"); setSource("all"); }}>{copy.reset}</button>}
        </div>

        <InlineFeedback message={notice} />
        <div className="table-wrap">
          <table className="app-table">
            <thead><tr><th>{copy.signal}</th><th>{copy.source}</th><th>{copy.reach}</th><th>{copy.analysis}</th><th>{copy.status}</th><th>{copy.date}</th></tr></thead>
            <tbody>{filtered.map((post) => <tr key={post.id} data-selected={post.id === selected?.id} data-visibility={post.visibility} onClick={() => setSelectedId(post.id)}>
              <td><button className="table-title-button" type="button" onClick={() => setSelectedId(post.id)}><span className="table-title">{post.title}</span><span className="table-subtitle">{post.body}</span></button></td>
              <td><span className="source-label">{sourceLabel(post.source, locale)}</span></td>
              <td>{post.votes} {copy.voteWord} · {post.comments} {copy.commentWord}</td>
              <td><span className={`analysis-state analysis-${post.embeddingState}`}><Sparkles size={12} /> {analysisLabel[post.embeddingState]}</span></td>
              <td><select className="status-select" value={post.status} disabled={isPending || readOnly} onClick={(event) => event.stopPropagation()} onChange={(event) => run(() => updateFeedbackStatus({ feedbackId: post.id, status: event.target.value }))} aria-label={`${copy.status}: ${post.title}`}>{statuses.map((value) => <option value={value} key={value}>{feedbackStatusLabel(value, locale)}</option>)}</select></td>
              <td>{formatDate(post.createdAt, locale)}</td>
            </tr>)}</tbody>
          </table>
          {!filtered.length && <div className="empty-state"><strong>{copy.empty}</strong><span>{copy.emptyHint}</span></div>}
        </div>

        {imports.length > 0 && <div className="recent-imports"><span className="app-kicker">{copy.recent}</span>{imports.slice(0, 3).map((item) => <div key={item.id}><span className={`import-state-dot import-state-${item.state}`} /><strong>{item.filename}</strong><span>{item.importedRows} {copy.added}{item.failedRows ? ` · ${item.failedRows} ${copy.skipped}` : ""} · {item.state.replaceAll("_", " ")}</span></div>)}</div>}
      </div>

      <aside className="inbox-inspector scroll-fade-y" aria-label={copy.inspector}>{selected ? <>
        <header><div><span className="app-kicker">{copy.customerSignal}</span><h2>{selected.title}</h2></div><Link href={readOnly && locale === "ru" ? `/ru/demo/post/${selected.id}` : readOnly ? `/demo/post/${selected.id}` : `/feedback/${workspaceSlug}/post/${selected.id}`} aria-label={copy.openPublic}><ExternalLink size={15} /></Link></header>
        <p className="inspector-quote">“{selected.body}”</p>
        <div className="inspector-meta"><div><span>{copy.customer}</span><strong>{selected.authorName}</strong></div><div><span>{copy.reach}</span><strong>{selected.votes} {copy.voteWord} · {selected.comments} {copy.commentWord}</strong></div><div><span>{copy.source}</span><strong>{sourceLabel(selected.source, locale)}</strong></div><div><span>{copy.visibility}</span><strong>{selected.visibility ?? copy.published}</strong></div></div>

        <div className={`analysis-callout analysis-callout-${selected.embeddingState}`} aria-live="polite"><Sparkles size={14} /><div><strong>{selected.embeddingState === "ready" ? copy.complete : selected.embeddingState === "pending" ? copy.pending : copy.attention}</strong><span>{selected.embeddingState === "ready" ? copy.completeBody : selected.embeddingState === "pending" ? copy.pendingBody : copy.attentionBody}</span></div>{selected.embeddingState === "failed" && <button className="button button-small button-outline" disabled={isPending} type="button" onClick={() => run(() => retryFeedbackAnalysis(selected.id))}><RotateCcw size={13} /> {copy.retry}</button>}</div>

        <section className="inspector-section"><h3>{copy.themes}</h3>{selectedThemeLinks.map((link) => { const theme = themes.find((item) => item.id === link.themeId); return <div className="suggestion-row" key={link.id}><div><strong>{theme?.name ?? copy.theme}</strong><span>{Math.round(link.similarity * 100)}% {copy.match} · {link.state}</span></div>{link.state === "suggested" && <span className="suggestion-actions"><button type="button" disabled={isPending || readOnly} onClick={() => run(() => reviewSuggestion({ linkId: link.id, state: "confirmed" }))} aria-label={locale === "ru" ? "Подтвердить тему" : "Confirm theme"}><Check size={13} /></button><button type="button" disabled={isPending || readOnly} onClick={() => run(() => reviewSuggestion({ linkId: link.id, state: "rejected" }))} aria-label={locale === "ru" ? "Отклонить тему" : "Reject theme"}><X size={13} /></button></span>}</div>; })}{!selectedThemeLinks.length && <p className="form-hint">{selected.embeddingState === "pending" ? copy.pendingThemes : selected.embeddingState === "failed" ? copy.failedThemes : copy.noThemes}</p>}<div className="manual-link"><select value={manualTheme} disabled={readOnly} onChange={(event) => setManualTheme(event.target.value)}><option value="">{copy.chooseTheme}</option>{themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select><button type="button" disabled={!manualTheme || isPending || readOnly} onClick={() => run(() => linkFeedbackToTheme({ feedbackId: selected.id, themeId: manualTheme }))}><Link2 size={13} /> {copy.link}</button></div></section>

        <section className="inspector-section"><h3>{copy.duplicates}</h3>{selectedDuplicates.map((link) => { const duplicate = posts.find((post) => post.id === link.duplicateId); return <div className="suggestion-row" key={link.id}><div><strong>{duplicate?.title ?? copy.existing}</strong><span>{Math.round(link.similarity * 100)}% {copy.match} · {link.state}</span></div>{link.state === "suggested" && <span className="suggestion-actions"><button type="button" disabled={isPending || readOnly} onClick={() => run(() => reviewDuplicateSuggestion({ linkId: link.id, state: "confirmed" }))} aria-label={copy.merge}><Check size={13} /></button><button type="button" disabled={isPending || readOnly} onClick={() => run(() => reviewDuplicateSuggestion({ linkId: link.id, state: "rejected" }))} aria-label={copy.rejectDuplicate}><X size={13} /></button></span>}</div>; })}{!selectedDuplicates.length && <p className="form-hint">{selected.embeddingState === "ready" ? copy.noDuplicates : copy.duplicatePending}</p>}</section>

        {!readOnly && <footer className="inspector-footer"><button className="button button-small button-outline" disabled={isPending} type="button" onClick={() => run(() => moderateFeedback({ feedbackId: selected.id, visibility: selected.visibility === "hidden" ? "published" : "hidden" }))}><Archive size={13} /> {selected.visibility === "hidden" ? copy.publishAgain : copy.hideSpam}</button></footer>}
      </> : <div className="inspector-empty">{copy.select}</div>}</aside>
    </section>
    {showImport && workspaceId && boardId && <CsvImporter workspaceId={workspaceId} boardId={boardId} onClose={() => { setShowImport(false); router.refresh(); }} />}
  </>;
}

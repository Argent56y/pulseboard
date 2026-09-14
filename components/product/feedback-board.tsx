import Link from "next/link";
import { MessageSquare, Search, SlidersHorizontal } from "lucide-react";
import { VoteButton } from "@/components/product/vote-button";
import { FeedbackTransitionLink } from "@/components/product/feedback-transition-link";
import type { FeedbackPost, FeedbackStatus, Workspace } from "@/lib/types";
import { feedbackStatusLabel, formatDate, sourceLabel } from "@/lib/utils";
import { localizedPath, type Locale } from "@/lib/i18n";

interface FeedbackBoardProps {
  workspace: Workspace;
  posts: FeedbackPost[];
  query?: string;
  status?: FeedbackStatus;
  nextCursor?: string;
  locale?: Locale;
}

export function FeedbackBoard({ workspace, posts, query = "", status, nextCursor, locale = "en" }: FeedbackBoardProps) {
  const root = localizedPath(locale, workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`);
  const publicPosts = posts.filter((post) => post.visibility !== "hidden");
  const nextParams = new URLSearchParams();
  if (query) nextParams.set("q", query);
  if (status) nextParams.set("status", status);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return <>
    <form className="public-controls" action={root}>
      <label className="search-field"><Search size={16} aria-hidden="true" /><span className="sr-only">{locale === "ru" ? "Поиск отзывов" : "Search feedback"}</span><input name="q" defaultValue={query} placeholder={locale === "ru" ? "Поиск отзывов" : "Search feedback"} /></label>
      <SlidersHorizontal size={15} aria-hidden="true" />
      <select className="filter-select" name="status" defaultValue={status ?? "all"} aria-label={locale === "ru" ? "Фильтр по статусу" : "Filter by status"}>
        <option value="all">{locale === "ru" ? "Все статусы" : "All statuses"}</option><option value="new">{feedbackStatusLabel("new", locale)}</option><option value="under_review">{feedbackStatusLabel("under_review", locale)}</option><option value="planned">{feedbackStatusLabel("planned", locale)}</option><option value="in_progress">{feedbackStatusLabel("in_progress", locale)}</option><option value="shipped">{feedbackStatusLabel("shipped", locale)}</option><option value="closed">{feedbackStatusLabel("closed", locale)}</option>
      </select>
      <button className="button button-small button-outline" type="submit">{locale === "ru" ? "Применить" : "Apply"}</button>
      {(query || status) && <Link className="clear-filters" href={root}>{locale === "ru" ? "Сбросить" : "Clear"}</Link>}
    </form>

    <div className="public-feedback-list" aria-live="polite">
      {publicPosts.length ? publicPosts.map((post) => <article className={`feedback-row ${post.visibility === "merged" ? "feedback-row-merged" : ""}`} key={post.id}>
        {post.visibility === "merged" ? <div className="vote-button vote-button-merged" aria-label={locale === "ru" ? "Объединённая идея" : "Merged idea"}>↳</div> : <VoteButton post={post} readOnly={workspace.isDemo} locale={locale} />}
        <div>
          <FeedbackTransitionLink href={`${root}/post/${post.id}`}><h2 style={{ viewTransitionName: `feedback-title-${post.id}` }}>{post.title}</h2></FeedbackTransitionLink>
          <p>{post.body}</p>
          {post.visibility === "merged" && post.duplicateOfId && <Link className="canonical-link" href={`${root}/post/${post.duplicateOfId}`}>{locale === "ru" ? "Объединено с" : "Merged into"} “{post.canonicalTitle ?? (locale === "ru" ? "основной идеей" : "canonical idea")}” →</Link>}
          <div className="feedback-row-meta"><span>{post.authorInitials} · {post.authorName}</span><span>{sourceLabel(post.source, locale)}</span><span>{formatDate(post.createdAt, locale)}</span><span><MessageSquare size={12} /> {post.comments}</span></div>
        </div>
        <span className={`status status-${post.status}`}>{feedbackStatusLabel(post.status, locale)}</span>
      </article>) : <div className="empty-state"><strong>{locale === "ru" ? "В этом представлении нет отзывов." : "No feedback in this view."}</strong><span>{locale === "ru" ? "Измените фильтры или предложите первую идею." : "Try a broader search or be the first to suggest an idea."}</span></div>}
    </div>
    {nextCursor && <div className="pagination-row"><Link className="button button-outline" href={`${root}?${nextParams.toString()}`}>{locale === "ru" ? "Загрузить более ранние отзывы" : "Load older feedback"}</Link></div>}
  </>;
}

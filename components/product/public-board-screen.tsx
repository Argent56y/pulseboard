import { FeedbackBoard } from "@/components/product/feedback-board";
import { NewFeedbackForm } from "@/components/product/new-feedback-form";
import { PublicHeader } from "@/components/product/public-header";
import { PendingActionReplayer } from "@/components/auth/pending-action-replayer";
import type { FeedbackPost, FeedbackStatus, Workspace } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export function PublicBoardScreen({ workspace, posts, boardId, query, status, nextCursor, locale = "en" }: { workspace: Workspace; posts: FeedbackPost[]; boardId: string; query?: string; status?: FeedbackStatus; nextCursor?: string; locale?: Locale }) {
  return <div className="product-page" lang={locale}>
    <PendingActionReplayer />
    <PublicHeader workspace={workspace} active="feedback" locale={locale} />
    <main className="public-shell">
      <header className="public-heading"><div><span className="app-kicker">{locale === "ru" ? "Отзывы клиентов · вымышленные данные" : "Customer feedback"}</span><h1>{locale === "ru" ? "Что нам стоит создать дальше?" : "What should we build next?"}</h1><p>{locale === "ru" ? "Предложите идею, проголосуйте за важное и проследите путь от запроса до релиза." : "Share an idea, vote on what matters, and follow the evidence from request to release."}</p></div><NewFeedbackForm workspace={workspace} boardId={boardId} locale={locale} /></header>
      <FeedbackBoard workspace={workspace} posts={posts} query={query} status={status} nextCursor={nextCursor} locale={locale} />
    </main>
  </div>;
}

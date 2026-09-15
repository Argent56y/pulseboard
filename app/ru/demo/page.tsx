import type { Metadata } from "next";
import { PublicBoardScreen } from "@/components/product/public-board-screen";
import { demoFeedbackRu, demoWorkspaceRu } from "@/lib/mock-data-ru";
import type { FeedbackStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Публичная доска — Pulseboard Demo",
  description: "Вымышленная публичная доска Pulseboard: отзывы, голоса, статусы и обсуждения без регистрации.",
  alternates: { canonical: "/ru/demo", languages: { "en-US": "/demo", "ru-RU": "/ru/demo" } },
};

const statuses = new Set<FeedbackStatus>(["new", "under_review", "planned", "in_progress", "shipped", "closed"]);

export default async function RussianDemoBoardPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const query = await searchParams;
  const status = query.status && statuses.has(query.status as FeedbackStatus) ? query.status as FeedbackStatus : undefined;
  const term = query.q?.trim().toLowerCase() ?? "";
  const posts = demoFeedbackRu.filter((post) => {
    const matchesTerm = !term || `${post.title} ${post.body} ${post.authorName}`.toLowerCase().includes(term);
    return matchesTerm && (!status || post.status === status);
  });

  return <PublicBoardScreen workspace={demoWorkspaceRu} posts={posts} boardId="22222222-2222-4222-8222-222222222222" query={query.q} status={status} locale="ru" />;
}

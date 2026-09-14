import type { Metadata } from "next";
import { PublicBoardScreen } from "@/components/product/public-board-screen";
import { demoFeedbackRu, demoWorkspaceRu } from "@/lib/mock-data-ru";

export const metadata: Metadata = {
  title: "Публичная доска — Pulseboard Demo",
  description: "Вымышленная публичная доска Pulseboard: отзывы, голоса, статусы и обсуждения без регистрации.",
  alternates: { canonical: "/ru/demo", languages: { "en-US": "/demo", "ru-RU": "/ru/demo" } },
};

export default function RussianDemoBoardPage() {
  return <PublicBoardScreen workspace={demoWorkspaceRu} posts={demoFeedbackRu} boardId="22222222-2222-4222-8222-222222222222" locale="ru" />;
}

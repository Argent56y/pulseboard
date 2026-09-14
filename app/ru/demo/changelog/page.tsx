import type { Metadata } from "next";
import { PublicChangelogScreen } from "@/components/product/public-changelog-screen";
import { demoChangelogRu, demoWorkspaceRu } from "@/lib/mock-data-ru";

export const metadata: Metadata = {
  title: "Обновления продукта — Pulseboard Demo",
  description: "Публичные обновления Pulseboard, связанные с roadmap и исходными сигналами клиентов.",
  alternates: { canonical: "/ru/demo/changelog", languages: { "en-US": "/demo/changelog", "ru-RU": "/ru/demo/changelog" } },
};

export default function RussianDemoChangelogPage() { return <PublicChangelogScreen workspace={demoWorkspaceRu} entries={demoChangelogRu} locale="ru" />; }

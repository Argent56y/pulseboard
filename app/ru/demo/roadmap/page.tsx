import type { Metadata } from "next";
import { PublicRoadmapScreen } from "@/components/product/public-roadmap-screen";
import { demoRoadmapRu, demoWorkspaceRu } from "@/lib/mock-data-ru";

export const metadata: Metadata = {
  title: "Публичный roadmap — Pulseboard Demo",
  description: "Посмотрите, как подтверждённые темы превращаются в понятный публичный roadmap.",
  alternates: { canonical: "/ru/demo/roadmap", languages: { "en-US": "/demo/roadmap", "ru-RU": "/ru/demo/roadmap" } },
};

export default function RussianDemoRoadmapPage() { return <PublicRoadmapScreen workspace={demoWorkspaceRu} items={demoRoadmapRu} locale="ru" />; }

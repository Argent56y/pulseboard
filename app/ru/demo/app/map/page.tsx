import type { Metadata } from "next";
import { SignalMap } from "@/components/product/admin/signal-map";
import { demoGraphRu } from "@/lib/mock-data-ru";

export const metadata: Metadata = {
  title: "Signal Map — Pulseboard Demo",
  description: "Интерактивная карта связей между отзывами, темами и решениями roadmap. Демо доступно без регистрации.",
  alternates: { canonical: "/ru/demo/app/map", languages: { "en-US": "/demo/app/map", "ru-RU": "/ru/demo/app/map" } },
};

export default function RussianDemoMapPage() { return <SignalMap graph={demoGraphRu} readOnly locale="ru" />; }

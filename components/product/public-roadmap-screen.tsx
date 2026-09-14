import { PublicHeader } from "@/components/product/public-header";
import { PublicRoadmap } from "@/components/product/public-roadmap";
import type { RoadmapItem, Workspace } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export function PublicRoadmapScreen({ workspace, items, locale = "en" }: { workspace: Workspace; items: RoadmapItem[]; locale?: Locale }) {
  return <div className="product-page" lang={locale}><PublicHeader workspace={workspace} active="roadmap" locale={locale} /><main className="public-shell"><header className="public-heading"><div><span className="app-kicker">{locale === "ru" ? "Публичный roadmap · вымышленные данные" : "Public roadmap"}</span><h1>{locale === "ru" ? "Направление с контекстом." : "Direction, with context."}</h1><p>{locale === "ru" ? "Что мы исследуем, что уже в работе и какие темы клиентов повлияли на решение." : "What we are exploring, what is moving, and which customer themes shaped the decision."}</p></div></header><PublicRoadmap items={items} locale={locale} /></main></div>;
}

import { PublicChangelog } from "@/components/product/public-changelog";
import { PublicHeader } from "@/components/product/public-header";
import type { ChangelogEntry, Workspace } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export function PublicChangelogScreen({ workspace, entries, locale = "en" }: { workspace: Workspace; entries: ChangelogEntry[]; locale?: Locale }) {
  return <div className="product-page" lang={locale}><PublicHeader workspace={workspace} active="changelog" locale={locale} /><main className="public-shell"><header className="public-heading"><div><span className="app-kicker">{locale === "ru" ? "Обновления продукта · вымышленные данные" : "Product updates"}</span><h1>{locale === "ru" ? "От обещания до релиза." : "From promise to shipped."}</h1><p>{locale === "ru" ? "Короткие заметки о релизах возвращают результат клиентам, которые помогли сформировать решение." : "Short release notes that close the loop with the customers who helped shape the work."}</p></div></header><PublicChangelog entries={entries} locale={locale} /></main></div>;
}

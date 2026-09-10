import { PublicChangelog } from "@/components/product/public-changelog";
import { PublicHeader } from "@/components/product/public-header";
import type { ChangelogEntry, Workspace } from "@/lib/types";

export function PublicChangelogScreen({ workspace, entries }: { workspace: Workspace; entries: ChangelogEntry[] }) {
  return <div className="product-page"><PublicHeader workspace={workspace} active="changelog" /><main className="public-shell"><header className="public-heading"><div><span className="app-kicker">Product updates</span><h1>From promise to shipped.</h1><p>Short release notes that close the loop with the customers who helped shape the work.</p></div></header><PublicChangelog entries={entries} /></main></div>;
}

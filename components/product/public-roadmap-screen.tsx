import { PublicHeader } from "@/components/product/public-header";
import { PublicRoadmap } from "@/components/product/public-roadmap";
import type { RoadmapItem, Workspace } from "@/lib/types";

export function PublicRoadmapScreen({ workspace, items }: { workspace: Workspace; items: RoadmapItem[] }) {
  return <div className="product-page"><PublicHeader workspace={workspace} active="roadmap" /><main className="public-shell"><header className="public-heading"><div><span className="app-kicker">Public roadmap</span><h1>Direction, with context.</h1><p>What we are exploring, what is moving, and which customer themes shaped the decision.</p></div></header><PublicRoadmap items={items} /></main></div>;
}

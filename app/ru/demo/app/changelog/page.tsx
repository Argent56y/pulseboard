import { ChangelogAdmin } from "@/components/product/admin/changelog-admin";
import { demoChangelogRu, demoRoadmapRu, demoWorkspaceRu } from "@/lib/mock-data-ru";

export default function RussianDemoChangelogPage() {
  return <ChangelogAdmin workspace={demoWorkspaceRu} entries={demoChangelogRu} roadmap={demoRoadmapRu} readOnly locale="ru" />;
}

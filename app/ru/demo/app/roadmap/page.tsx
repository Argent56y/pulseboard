import { RoadmapBoard } from "@/components/product/admin/roadmap-board";
import { demoRoadmapRu, demoThemesRu, demoWorkspaceRu } from "@/lib/mock-data-ru";

export default function RussianDemoRoadmapPage() {
  return <RoadmapBoard workspace={demoWorkspaceRu} items={demoRoadmapRu} themes={demoThemesRu} readOnly locale="ru" />;
}

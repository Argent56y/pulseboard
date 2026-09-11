import { RoadmapBoard } from "@/components/product/admin/roadmap-board";
import { demoRoadmap, demoThemes, demoWorkspace } from "@/lib/mock-data";

export default function DemoRoadmapPage() {
  return <RoadmapBoard workspace={demoWorkspace} items={demoRoadmap} themes={demoThemes} readOnly />;
}

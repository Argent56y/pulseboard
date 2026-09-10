import { PublicRoadmapScreen } from "@/components/product/public-roadmap-screen";
import { demoRoadmap, demoWorkspace } from "@/lib/mock-data";
export default function DemoRoadmapPage() { return <PublicRoadmapScreen workspace={demoWorkspace} items={demoRoadmap} />; }

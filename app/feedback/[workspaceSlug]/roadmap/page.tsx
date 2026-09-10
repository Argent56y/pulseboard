import { notFound } from "next/navigation";
import { PublicRoadmapScreen } from "@/components/product/public-roadmap-screen";
import { getRoadmap, getWorkspace } from "@/lib/data";

export default async function RoadmapPage({ params }: { params: Promise<{ workspaceSlug: string }> }) { const { workspaceSlug } = await params; const [workspace, items] = await Promise.all([getWorkspace(workspaceSlug), getRoadmap(workspaceSlug)]); if (!workspace || !workspace.isPublic) notFound(); return <PublicRoadmapScreen workspace={workspace} items={items} />; }

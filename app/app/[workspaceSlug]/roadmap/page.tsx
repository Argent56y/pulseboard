import { notFound } from "next/navigation";
import { RoadmapBoard } from "@/components/product/admin/roadmap-board";
import { getRoadmap, getThemes, getWorkspace } from "@/lib/data";
export default async function AppRoadmapPage({ params, searchParams }: { params: Promise<{ workspaceSlug: string }>; searchParams: Promise<{ selected?: string }> }) { const [{ workspaceSlug }, query] = await Promise.all([params, searchParams]); const [workspace, items, themes] = await Promise.all([getWorkspace(workspaceSlug), getRoadmap(workspaceSlug), getThemes(workspaceSlug)]); if (!workspace) notFound(); return <RoadmapBoard workspace={workspace} items={items} themes={themes} initialSelected={query.selected} />; }

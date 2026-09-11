import { notFound } from "next/navigation";
import { ChangelogAdmin } from "@/components/product/admin/changelog-admin";
import { getAdminChangelog, getRoadmap, getWorkspace } from "@/lib/data";
export default async function AppChangelogPage({ params }: { params: Promise<{ workspaceSlug: string }> }) { const { workspaceSlug } = await params; const [workspace, entries, roadmap] = await Promise.all([getWorkspace(workspaceSlug), getAdminChangelog(workspaceSlug), getRoadmap(workspaceSlug)]); if (!workspace) notFound(); return <ChangelogAdmin workspace={workspace} entries={entries} roadmap={roadmap} />; }

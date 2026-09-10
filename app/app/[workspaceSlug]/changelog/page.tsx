import { notFound } from "next/navigation";
import { ChangelogAdmin } from "@/components/product/admin/changelog-admin";
import { getChangelog, getWorkspace } from "@/lib/data";
export default async function AppChangelogPage({ params }: { params: Promise<{ workspaceSlug: string }> }) { const { workspaceSlug } = await params; const [workspace, entries] = await Promise.all([getWorkspace(workspaceSlug), getChangelog(workspaceSlug)]); if (!workspace) notFound(); return <ChangelogAdmin workspace={workspace} entries={entries} />; }

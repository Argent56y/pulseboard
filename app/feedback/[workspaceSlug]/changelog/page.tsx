import { notFound } from "next/navigation";
import { PublicChangelogScreen } from "@/components/product/public-changelog-screen";
import { getChangelog, getWorkspace } from "@/lib/data";

export default async function ChangelogPage({ params }: { params: Promise<{ workspaceSlug: string }> }) { const { workspaceSlug } = await params; const [workspace, entries] = await Promise.all([getWorkspace(workspaceSlug), getChangelog(workspaceSlug)]); if (!workspace || !workspace.isPublic) notFound(); return <PublicChangelogScreen workspace={workspace} entries={entries} />; }

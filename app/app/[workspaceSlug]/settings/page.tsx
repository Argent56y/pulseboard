import { notFound } from "next/navigation";
import { SettingsPanel } from "@/components/product/admin/settings-panel";
import { getThemes, getWorkspace } from "@/lib/data";
export default async function SettingsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) { const { workspaceSlug } = await params; const [workspace, themes] = await Promise.all([getWorkspace(workspaceSlug), getThemes(workspaceSlug)]); if (!workspace) notFound(); return <SettingsPanel workspace={workspace} themes={themes} />; }

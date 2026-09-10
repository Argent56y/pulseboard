import { notFound } from "next/navigation";
import { AppShell } from "@/components/product/admin/app-shell";
import { getWorkspace } from "@/lib/data";

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ workspaceSlug: string }> }) { const { workspaceSlug } = await params; const workspace = await getWorkspace(workspaceSlug); if (!workspace || workspace.isDemo) notFound(); return <AppShell workspace={workspace}>{children}</AppShell>; }

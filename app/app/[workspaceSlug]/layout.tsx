import { AppShell } from "@/components/product/admin/app-shell";
import { requireWorkspaceMembership } from "@/lib/auth";
import { getFeedback, getRoadmap, getThemes } from "@/lib/data";
import type { CommandItem } from "@/lib/types";

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const nextPath = `/app/${workspaceSlug}`;
  const [{ viewer, memberships, membership }, feedback, themes, roadmap] = await Promise.all([
    requireWorkspaceMembership(workspaceSlug, nextPath),
    getFeedback(workspaceSlug),
    getThemes(workspaceSlug),
    getRoadmap(workspaceSlug),
  ]);
  const root = `/app/${workspaceSlug}`;
  const commands: CommandItem[] = [
    ...feedback.map((post) => ({ id: post.id, kind: "feedback" as const, label: post.title, detail: "Feedback", href: `${root}/inbox?selected=${post.id}` })),
    ...themes.map((theme) => ({ id: theme.id, kind: "theme" as const, label: theme.name, detail: "Theme", href: `${root}/map?selected=${theme.id}` })),
    ...roadmap.map((item) => ({ id: item.id, kind: "roadmap" as const, label: item.title, detail: "Roadmap", href: `${root}/roadmap?selected=${item.id}` })),
  ];

  return <AppShell
    workspace={membership.workspace}
    role={membership.role}
    viewer={viewer}
    memberships={memberships}
    commands={commands}
  >{children}</AppShell>;
}

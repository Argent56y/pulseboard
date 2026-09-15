import { AppShell } from "@/components/product/admin/app-shell";
import { demoFeedback, demoRoadmap, demoThemes, demoWorkspace } from "@/lib/mock-data";
import type { CommandItem } from "@/lib/types";

export default function DemoWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const commands: CommandItem[] = [
    ...demoFeedback.map((item) => ({ id: item.id, kind: "feedback" as const, label: item.title, detail: item.body, href: `/demo/post/${item.id}` })),
    ...demoThemes.map((item) => ({ id: item.id, kind: "theme" as const, label: item.name, detail: item.description, href: `/demo/app/map?selected=${item.id}` })),
    ...demoRoadmap.map((item) => ({ id: item.id, kind: "roadmap" as const, label: item.title, detail: item.summary, href: `/demo/app/map?selected=${item.id}` })),
  ];
  return <AppShell workspace={demoWorkspace} commands={commands} readOnly>{children}</AppShell>;
}

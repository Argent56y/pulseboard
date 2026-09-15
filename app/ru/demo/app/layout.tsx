import { AppShell } from "@/components/product/admin/app-shell";
import { demoFeedbackRu, demoRoadmapRu, demoThemesRu, demoWorkspaceRu } from "@/lib/mock-data-ru";
import type { CommandItem } from "@/lib/types";

export default function RussianDemoWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const commands: CommandItem[] = [
    ...demoFeedbackRu.map((item) => ({ id: item.id, kind: "feedback" as const, label: item.title, detail: item.body, href: `/ru/demo/post/${item.id}` })),
    ...demoThemesRu.map((item) => ({ id: item.id, kind: "theme" as const, label: item.name, detail: item.description, href: `/ru/demo/app/map?selected=${item.id}` })),
    ...demoRoadmapRu.map((item) => ({ id: item.id, kind: "roadmap" as const, label: item.title, detail: item.summary, href: `/ru/demo/app/map?selected=${item.id}` })),
  ];
  return <AppShell workspace={demoWorkspaceRu} commands={commands} readOnly locale="ru">{children}</AppShell>;
}

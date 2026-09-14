import { AppShell } from "@/components/product/admin/app-shell";
import { demoWorkspaceRu } from "@/lib/mock-data-ru";

export default function RussianDemoWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <AppShell workspace={demoWorkspaceRu} readOnly locale="ru">{children}</AppShell>;
}

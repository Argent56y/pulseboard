import { AppShell } from "@/components/product/admin/app-shell";
import { demoWorkspace } from "@/lib/mock-data";

export default function DemoWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <AppShell workspace={demoWorkspace} readOnly>{children}</AppShell>;
}

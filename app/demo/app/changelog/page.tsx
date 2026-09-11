import { ChangelogAdmin } from "@/components/product/admin/changelog-admin";
import { demoChangelog, demoWorkspace } from "@/lib/mock-data";

export default function DemoChangelogPage() {
  return <ChangelogAdmin workspace={demoWorkspace} entries={demoChangelog} readOnly />;
}

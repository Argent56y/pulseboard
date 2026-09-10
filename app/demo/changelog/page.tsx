import { PublicChangelogScreen } from "@/components/product/public-changelog-screen";
import { demoChangelog, demoWorkspace } from "@/lib/mock-data";
export default function DemoChangelogPage() { return <PublicChangelogScreen workspace={demoWorkspace} entries={demoChangelog} />; }

import { SignalMap } from "@/components/product/admin/signal-map";
import { getGraph } from "@/lib/data";
export default async function MapPage({ params }: { params: Promise<{ workspaceSlug: string }> }) { const { workspaceSlug } = await params; return <SignalMap graph={await getGraph(workspaceSlug)} />; }

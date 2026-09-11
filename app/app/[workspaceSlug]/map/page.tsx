import { SignalMap } from "@/components/product/admin/signal-map";
import { getGraph } from "@/lib/data";
export default async function MapPage({ params, searchParams }: { params: Promise<{ workspaceSlug: string }>; searchParams: Promise<{ selected?: string }> }) { const [{ workspaceSlug }, query] = await Promise.all([params, searchParams]); return <SignalMap graph={await getGraph(workspaceSlug)} initialSelected={query.selected} />; }

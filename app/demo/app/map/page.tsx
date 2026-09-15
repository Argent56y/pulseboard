import { SignalMap } from "@/components/product/admin/signal-map";
import { demoGraph } from "@/lib/mock-data";

export default async function DemoMapPage({ searchParams }: { searchParams: Promise<{ selected?: string }> }) {
  const query = await searchParams;
  return <SignalMap graph={demoGraph} readOnly initialSelected={query.selected} />;
}

import { SignalMap } from "@/components/product/admin/signal-map";
import { demoGraph } from "@/lib/mock-data";

export default function DemoMapPage() { return <SignalMap graph={demoGraph} readOnly />; }

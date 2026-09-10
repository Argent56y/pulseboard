import { AppShell } from "@/components/product/admin/app-shell";
import { SignalMap } from "@/components/product/admin/signal-map";
import { demoGraph, demoWorkspace } from "@/lib/mock-data";

export default function DemoMapPage() { return <AppShell workspace={demoWorkspace} readOnly><SignalMap graph={demoGraph} readOnly /></AppShell>; }

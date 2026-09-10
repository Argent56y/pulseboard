import Link from "next/link";
import { ArrowLeft, CircleDot } from "lucide-react";
import type { Workspace } from "@/lib/types";

interface PublicHeaderProps {
  workspace: Workspace;
  active: "feedback" | "roadmap" | "changelog";
}

export function PublicHeader({ workspace, active }: PublicHeaderProps) {
  const root = workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`;
  return (
    <header className="product-topbar">
      <div className="product-brand">
        <span className="wordmark-dot" />
        <div>
          <strong>{workspace.name}</strong>
          <span>Powered by Pulseboard</span>
        </div>
      </div>
      <nav className="product-tabs" aria-label={`${workspace.name} feedback navigation`}>
        <Link href={root} aria-current={active === "feedback" ? "page" : undefined}>Feedback</Link>
        <Link href={`${root}/roadmap`} aria-current={active === "roadmap" ? "page" : undefined}>Roadmap</Link>
        <Link href={`${root}/changelog`} aria-current={active === "changelog" ? "page" : undefined}>Changelog</Link>
      </nav>
      {workspace.isDemo ? (
        <Link href="/demo/app/map" className="demo-badge"><CircleDot size={11} /> Founder view</Link>
      ) : (
        <Link href="/" className="demo-badge"><ArrowLeft size={11} /> Pulseboard</Link>
      )}
    </header>
  );
}

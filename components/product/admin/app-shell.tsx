"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  ExternalLink,
  GitBranch,
  Map,
  Megaphone,
  Search,
  Settings,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Workspace } from "@/lib/types";

interface AppShellProps {
  workspace: Workspace;
  readOnly?: boolean;
  children: React.ReactNode;
}

const routeMeta = [
  { segment: "/inbox", label: "Feedback inbox", kicker: "Triage" },
  { segment: "/map", label: "Signal Map", kicker: "Evidence graph" },
  { segment: "/roadmap", label: "Roadmap", kicker: "Product direction" },
  { segment: "/changelog", label: "Changelog", kicker: "Release notes" },
  { segment: "/settings", label: "Settings", kicker: "Workspace" },
];

export function AppShell({ workspace, readOnly = false, children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const appRoot = readOnly ? "/demo/app" : `/app/${workspace.slug}`;
  const publicRoot = workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`;
  const current = useMemo(
    () => routeMeta.find((route) => pathname.includes(route.segment)) ?? routeMeta[1],
    [pathname],
  );
  const nav = readOnly
    ? [
        { label: "Signal Map", href: `${appRoot}/map`, icon: Map },
        { label: "Public board", href: publicRoot, icon: ClipboardList },
        { label: "Roadmap", href: `${publicRoot}/roadmap`, icon: GitBranch },
        { label: "Changelog", href: `${publicRoot}/changelog`, icon: Megaphone },
      ]
    : [
        { label: "Inbox", href: `${appRoot}/inbox`, icon: ClipboardList },
        { label: "Signal Map", href: `${appRoot}/map`, icon: Map },
        { label: "Roadmap", href: `${appRoot}/roadmap`, icon: GitBranch },
        { label: "Changelog", href: `${appRoot}/changelog`, icon: Megaphone },
        { label: "Settings", href: `${appRoot}/settings`, icon: Settings },
      ];

  return (
    <div className="app-page">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="app-shell" data-collapsed={collapsed}>
        <aside className="app-sidebar" aria-label="Workspace navigation">
          <div className="app-sidebar-brand">
            <Link className="wordmark" href="/">
              <span className="wordmark-dot" />
              <span>Pulseboard</span>
            </Link>
            <button
              className="sidebar-collapse"
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
            </button>
          </div>

          <div className="workspace-switcher">
            <div className="workspace-mark">{workspace.name.slice(0, 1)}</div>
            <div>
              <strong>{workspace.name}</strong>
              <span>{readOnly ? "Sample workspace" : "Owner workspace"}</span>
            </div>
          </div>

          <span className="nav-label">Workspace</span>
          <nav className="app-nav">
            {nav.map((item) => {
              const active = pathname === item.href || (!readOnly && pathname.startsWith(`${item.href}/`));
              return (
                <Link key={item.href} href={item.href} data-active={active} title={item.label}>
                  <item.icon size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="app-sidebar-footer">
            <Link href={publicRoot}>
              <ExternalLink size={15} aria-hidden="true" />
              <span>View public board</span>
            </Link>
            <div className="sidebar-profile">
              <span className="avatar-small">SD</span>
              <div><strong>Seva Dev-a</strong><span>Product builder</span></div>
            </div>
          </div>
        </aside>

        <main className="app-main" id="main-content" tabIndex={-1}>
          <header className="app-header">
            <div>
              <span className="app-kicker">{current.kicker}</span>
              <h1>{current.label}</h1>
            </div>
            <div className="app-header-actions">
              {readOnly && <span className="demo-badge">Read-only demo</span>}
              <button className="header-search" type="button" aria-label="Search feedback">
                <Search size={14} />
                <span>Search</span>
                <kbd>⌘ K</kbd>
              </button>
              <button className="icon-button" type="button" aria-label="Notifications">
                <Bell size={15} />
              </button>
              {!readOnly && <span className="avatar-small">SD</span>}
            </div>
          </header>
          <div className="app-content">{children}</div>
        </main>
      </div>
    </div>
  );
}

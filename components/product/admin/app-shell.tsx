"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { type MouseEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [navigationPending, startNavigation] = useTransition();
  const appRoot = readOnly ? "/demo/app" : `/app/${workspace.slug}`;
  const publicRoot = workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`;
  const current = useMemo(
    () => routeMeta.find((route) => pathname.includes(route.segment)) ?? routeMeta[1],
    [pathname],
  );

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    shell.dataset.navigationReady = "true";
    return () => { delete shell.dataset.navigationReady; };
  }, []);

  const nav = readOnly
    ? [
        { label: "Inbox", href: `${appRoot}/inbox`, icon: ClipboardList },
        { label: "Signal Map", href: `${appRoot}/map`, icon: Map },
        { label: "Roadmap", href: `${appRoot}/roadmap`, icon: GitBranch },
        { label: "Changelog", href: `${appRoot}/changelog`, icon: Megaphone },
      ]
    : [
        { label: "Inbox", href: `${appRoot}/inbox`, icon: ClipboardList },
        { label: "Signal Map", href: `${appRoot}/map`, icon: Map },
        { label: "Roadmap", href: `${appRoot}/roadmap`, icon: GitBranch },
        { label: "Changelog", href: `${appRoot}/changelog`, icon: Megaphone },
        { label: "Settings", href: `${appRoot}/settings`, icon: Settings },
      ];
  function markNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (
      event.button > 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      pathname === href
    ) return;

    event.preventDefault();
    setPendingHref(href);
    startNavigation(() => router.push(href));
  }

  return (
    <div className="app-page">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div ref={shellRef} className="app-shell" data-collapsed={collapsed}>
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
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={active}
                  data-pending={navigationPending && pendingHref === item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => markNavigation(event, item.href)}
                  title={item.label}
                >
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
            <div className="workspace-heading" key={current.segment}>
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
            <span className="workspace-progress" data-visible={navigationPending} aria-hidden="true"><i /></span>
            <span className="sr-only" aria-live="polite">{navigationPending ? `Opening ${nav.find((item) => item.href === pendingHref)?.label ?? "section"}` : ""}</span>
          </header>
          <div className="app-content">
            <div className="workspace-view" key={pathname}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

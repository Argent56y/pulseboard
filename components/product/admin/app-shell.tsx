"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  ExternalLink,
  GitBranch,
  Map,
  Megaphone,
  Search,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { signOut } from "@/app/actions";
import type { CommandItem, ViewerProfile, Workspace, WorkspaceMembership, WorkspaceRole } from "@/lib/types";

interface AppShellProps {
  workspace: Workspace;
  role?: WorkspaceRole;
  viewer?: ViewerProfile;
  memberships?: WorkspaceMembership[];
  commands?: CommandItem[];
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

export function AppShell({ workspace, role = "owner", viewer, memberships = [], commands = [], readOnly = false, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [navigationPending, startNavigation] = useTransition();
  const [commandQuery, setCommandQuery] = useState("");
  const commandRef = useRef<HTMLDialogElement>(null);
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        commandRef.current?.showModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredCommands = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    return (query ? commands.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(query)) : commands).slice(0, 12);
  }, [commandQuery, commands]);

  const initials = viewer?.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SD";

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

          {readOnly ? <div className="workspace-switcher">
            <div className="workspace-mark">{workspace.name.slice(0, 1)}</div>
            <div><strong>{workspace.name}</strong><span>Sample workspace</span></div>
          </div> : <details className="workspace-menu">
            <summary className="workspace-switcher">
              <div className="workspace-mark">{workspace.name.slice(0, 1)}</div>
              <div><strong>{workspace.name}</strong><span>{role === "owner" ? "Owner" : "Editor"}</span></div>
              <ChevronDown size={14} />
            </summary>
            <div className="workspace-menu-panel">
              {memberships.map((item) => <Link key={item.workspace.id} href={`/app/${item.workspace.slug}/inbox`} data-active={item.workspace.id === workspace.id}>
                <span className="workspace-mark">{item.workspace.name.slice(0, 1)}</span>
                <span><strong>{item.workspace.name}</strong><small>{item.role}</small></span>
              </Link>)}
              <Link href="/onboarding" className="workspace-create-link">+ New workspace</Link>
            </div>
          </details>}

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
              {viewer?.avatarUrl ? <img className="avatar-small" src={viewer.avatarUrl} alt="" /> : <span className="avatar-small">{initials}</span>}
              <div><strong>{viewer?.displayName ?? "Seva Dev-a"}</strong><span>{readOnly ? "Demo guide" : role}</span></div>
              {!readOnly && <form action={signOut}><button className="profile-signout" type="submit" aria-label="Sign out" title="Sign out"><LogOut size={14} /></button></form>}
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
              <button className="header-search" type="button" aria-label="Search workspace" onClick={() => commandRef.current?.showModal()}>
                <Search size={14} />
                <span>Search</span>
                <kbd>⌘ K</kbd>
              </button>
              {!readOnly && (viewer?.avatarUrl ? <img className="avatar-small" src={viewer.avatarUrl} alt="" /> : <span className="avatar-small">{initials}</span>)}
            </div>
            <span className="workspace-progress" data-visible={navigationPending} aria-hidden="true"><i /></span>
            <span className="sr-only" aria-live="polite">{navigationPending ? `Opening ${nav.find((item) => item.href === pendingHref)?.label ?? "section"}` : ""}</span>
          </header>
          <div className="app-content">
            <div className="workspace-view" key={pathname}>{children}</div>
          </div>
        </main>
      </div>
      <dialog ref={commandRef} className="command-dialog" onClose={() => setCommandQuery("")}>
        <div className="command-dialog-head">
          <Search size={16} />
          <input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Search feedback, themes and roadmap…" aria-label="Search workspace" />
          <button type="button" onClick={() => commandRef.current?.close()} aria-label="Close search"><X size={15} /></button>
        </div>
        <div className="command-results">
          {filteredCommands.map((item) => <Link key={`${item.kind}-${item.id}`} href={item.href} onClick={() => commandRef.current?.close()}>
            <span className={`command-kind command-kind-${item.kind}`}>{item.detail}</span>
            <strong>{item.label}</strong>
          </Link>)}
          {!filteredCommands.length && <div className="command-empty">No matching signals or decisions.</div>}
        </div>
      </dialog>
    </div>
  );
}

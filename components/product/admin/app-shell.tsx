"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Clock3,
  ExternalLink,
  GitBranch,
  Layers3,
  Map,
  Megaphone,
  MessageSquare,
  Search,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { signOut } from "@/app/actions";
import type { CommandItem, ViewerProfile, Workspace, WorkspaceMembership, WorkspaceRole } from "@/lib/types";
import { LocaleSwitch } from "@/components/locale-switch";
import { localizedPath, type Locale } from "@/lib/i18n";

interface AppShellProps {
  workspace: Workspace;
  role?: WorkspaceRole;
  viewer?: ViewerProfile;
  memberships?: WorkspaceMembership[];
  commands?: CommandItem[];
  readOnly?: boolean;
  locale?: Locale;
  children: React.ReactNode;
}

const routeMeta = [
  { segment: "/inbox", label: "Feedback inbox", kicker: "Triage" },
  { segment: "/map", label: "Signal Map", kicker: "Evidence graph" },
  { segment: "/roadmap", label: "Roadmap", kicker: "Product direction" },
  { segment: "/changelog", label: "Changelog", kicker: "Release notes" },
  { segment: "/settings", label: "Settings", kicker: "Workspace" },
];

export function AppShell({ workspace, role = "owner", viewer, memberships = [], commands = [], readOnly = false, locale = "en", children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [navigationPending, startNavigation] = useTransition();
  const [commandQuery, setCommandQuery] = useState("");
  const [activeCommand, setActiveCommand] = useState(0);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([]);
  const reduceMotion = useReducedMotion();
  const commandRef = useRef<HTMLDialogElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const openCommandMenu = useCallback(() => {
    if (!commandRef.current?.open) commandRef.current?.showModal();
    setActiveCommand(0);
    requestAnimationFrame(() => commandInputRef.current?.focus());
  }, []);
  const appRoot = readOnly ? localizedPath(locale, "/demo/app") : `/app/${workspace.slug}`;
  const publicRoot = localizedPath(locale, workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`);
  const current = useMemo(() => {
    const found = routeMeta.find((route) => pathname.includes(route.segment)) ?? routeMeta[1];
    if (locale === "en") return found;
    const ru = {
      "/inbox": { label: "Входящие отзывы", kicker: "Разбор" },
      "/map": { label: "Signal Map", kicker: "Карта доказательств" },
      "/roadmap": { label: "Roadmap", kicker: "Направление продукта" },
      "/changelog": { label: "Обновления", kicker: "Заметки о релизах" },
      "/settings": { label: "Настройки", kicker: "Workspace" },
    } as const;
    return { ...found, ...ru[found.segment as keyof typeof ru] };
  }, [pathname, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("pulseboard-recent-commands");
        if (saved) setRecentCommandIds(JSON.parse(saved));
      } catch {
        setRecentCommandIds([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
        openCommandMenu();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCommandMenu]);

  const commandGroups = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    const matches = (query ? commands.filter((item) => `${item.label} ${item.detail} ${item.kind}`.toLowerCase().includes(query)) : commands).slice(0, 18);
    const groups: Array<{ key: string; label: string; items: CommandItem[] }> = [];
    const used = new Set<string>();

    if (!query) {
      const recent = recentCommandIds
        .map((id) => commands.find((item) => `${item.kind}:${item.id}` === id))
        .filter(Boolean)
        .slice(0, 4) as CommandItem[];
      if (recent.length) {
        recent.forEach((item) => used.add(`${item.kind}:${item.id}`));
        groups.push({ key: "recent", label: locale === "ru" ? "Недавние" : "Recent", items: recent });
      }
    }

    const labels = {
      feedback: locale === "ru" ? "Отзывы" : "Feedback",
      theme: locale === "ru" ? "Темы" : "Themes",
      roadmap: "Roadmap",
    };
    (["feedback", "theme", "roadmap"] as const).forEach((kind) => {
      const items = matches.filter((item) => item.kind === kind && !used.has(`${item.kind}:${item.id}`));
      if (items.length) groups.push({ key: kind, label: labels[kind], items });
    });

    let index = 0;
    return groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item, commandIndex: index++ })),
    }));
  }, [commandQuery, commands, locale, recentCommandIds]);

  const filteredCommands = useMemo(
    () => commandGroups.flatMap((group) => group.items),
    [commandGroups],
  );

  const searchCopy = locale === "ru" ? {
    label: "Поиск по workspace",
    placeholder: "Найти отзыв, тему или решение…",
    close: "Закрыть поиск",
    empty: "Ничего не найдено",
    emptyHint: "Попробуйте другое название или ключевое слово.",
    count: "результатов",
    navigate: "выбор",
    open: "открыть",
  } : {
    label: "Search workspace",
    placeholder: "Search feedback, themes or roadmap…",
    close: "Close search",
    empty: "No matching signals or decisions",
    emptyHint: "Try another title or keyword.",
    count: "results",
    navigate: "navigate",
    open: "open",
  };

  function closeCommandMenu() {
    commandRef.current?.close();
  }

  function rememberCommand(item: CommandItem) {
    const key = `${item.kind}:${item.id}`;
    setRecentCommandIds((current) => {
      const next = [key, ...current.filter((id) => id !== key)].slice(0, 6);
      try { window.localStorage.setItem("pulseboard-recent-commands", JSON.stringify(next)); } catch { /* storage is optional */ }
      return next;
    });
  }

  function openCommand(item: CommandItem) {
    rememberCommand(item);
    closeCommandMenu();
    router.push(item.href);
  }

  const initials = viewer?.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SD";

  const nav = readOnly
    ? [
        { label: locale === "ru" ? "Входящие" : "Inbox", href: `${appRoot}/inbox`, icon: ClipboardList },
        { label: "Signal Map", href: `${appRoot}/map`, icon: Map },
        { label: "Roadmap", href: `${appRoot}/roadmap`, icon: GitBranch },
        { label: locale === "ru" ? "Обновления" : "Changelog", href: `${appRoot}/changelog`, icon: Megaphone },
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
      <a className="skip-link" href="#main-content">{locale === "ru" ? "Перейти к содержимому" : "Skip to content"}</a>
      <div ref={shellRef} className="app-shell" data-collapsed={collapsed}>
        <aside className="app-sidebar" aria-label={locale === "ru" ? "Навигация workspace" : "Workspace navigation"}>
          <div className="app-sidebar-brand">
            <Link className="wordmark" href={localizedPath(locale, "/")}>
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
            <div><strong>{workspace.name}</strong><span>{locale === "ru" ? "Демо с вымышленными данными" : "Sample workspace"}</span></div>
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

          <span className="nav-label">{locale === "ru" ? "Рабочая область" : "Workspace"}</span>
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
              <span>{locale === "ru" ? "Открыть доску" : "View public board"}</span>
            </Link>
            <div className="sidebar-profile">
              {viewer?.avatarUrl ? <img className="avatar-small" src={viewer.avatarUrl} alt="" /> : <span className="avatar-small">{initials}</span>}
              <div><strong>{viewer?.displayName ?? "Seva Dev-a"}</strong><span>{readOnly ? (locale === "ru" ? "Демо-режим" : "Demo guide") : role}</span></div>
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
              {readOnly && <span className="demo-badge">{locale === "ru" ? "Только чтение · вымышленные данные" : "Read-only demo"}</span>}
              {readOnly && <LocaleSwitch locale={locale} section={pathname.replace(/^\/ru/, "")} />}
              <button className="header-search" type="button" aria-label={searchCopy.label} onClick={openCommandMenu}>
                <Search size={14} />
                <span>{locale === "ru" ? "Поиск" : "Search"}</span>
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
      <dialog
        ref={commandRef}
        className="command-dialog"
        aria-label={searchCopy.label}
        onClose={() => { setCommandQuery(""); setActiveCommand(0); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeCommandMenu(); }}
      >
        <div className="command-dialog-head">
          <Search size={16} />
          <input
            ref={commandInputRef}
            value={commandQuery}
            onChange={(event) => { setCommandQuery(event.target.value); setActiveCommand(0); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (filteredCommands.length) setActiveCommand((index) => Math.min(index + 1, filteredCommands.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveCommand((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter" && filteredCommands[activeCommand]) {
                event.preventDefault();
                openCommand(filteredCommands[activeCommand]);
              }
            }}
            placeholder={searchCopy.placeholder}
            aria-label={searchCopy.label}
            role="combobox"
            aria-expanded="true"
            aria-controls="workspace-command-results"
            aria-activedescendant={filteredCommands[activeCommand] ? `command-${filteredCommands[activeCommand].kind}-${filteredCommands[activeCommand].id}` : undefined}
          />
          <button type="button" onClick={closeCommandMenu} aria-label={searchCopy.close}><X size={16} /></button>
        </div>
        <div className="command-results scroll-fade-y" id="workspace-command-results" role="listbox" aria-label={searchCopy.label}>
          <AnimatePresence initial={false} mode="popLayout">
            {commandGroups.map((group) => <motion.section
              className="command-group"
              key={`${commandQuery ? "search" : "browse"}-${group.key}`}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <header><span>{group.key === "recent" && <Clock3 size={11} aria-hidden="true" />}{group.label}</span><small>{group.items.length}</small></header>
              {group.items.map((item) => {
                const index = "commandIndex" in item ? Number(item.commandIndex) : 0;
                const Icon = item.kind === "feedback" ? MessageSquare : item.kind === "theme" ? Layers3 : GitBranch;
                return <Link
                  id={`command-${item.kind}-${item.id}`}
                  key={`${item.kind}-${item.id}`}
                  href={item.href}
                  role="option"
                  aria-selected={index === activeCommand}
                  data-active={index === activeCommand}
                  onMouseEnter={() => setActiveCommand(index)}
                  onClick={() => { rememberCommand(item); closeCommandMenu(); }}
                >
                  <span className={`command-result-icon command-result-icon-${item.kind}`}><Icon size={15} aria-hidden="true" /></span>
                  <span className="command-result-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <span className={`command-kind command-kind-${item.kind}`}>{item.kind === "feedback" ? (locale === "ru" ? "Отзыв" : "Feedback") : item.kind === "theme" ? (locale === "ru" ? "Тема" : "Theme") : "Roadmap"}</span>
                </Link>;
              })}
            </motion.section>)}
          </AnimatePresence>
          {!filteredCommands.length && <div className="command-empty"><Search size={19} /><strong>{searchCopy.empty}</strong><span>{searchCopy.emptyHint}</span></div>}
        </div>
        <footer className="command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> {searchCopy.navigate}</span>
          <span><kbd>↵</kbd> {searchCopy.open}</span>
          <span className="command-result-count">{filteredCommands.length} {searchCopy.count}</span>
        </footer>
      </dialog>
    </div>
  );
}

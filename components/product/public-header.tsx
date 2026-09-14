import Link from "next/link";
import { ArrowLeft, CircleDot } from "lucide-react";
import type { Workspace } from "@/lib/types";
import { LocaleSwitch } from "@/components/locale-switch";
import { localizedPath, type Locale } from "@/lib/i18n";

interface PublicHeaderProps {
  workspace: Workspace;
  active: "feedback" | "roadmap" | "changelog";
  locale?: Locale;
}

export function PublicHeader({ workspace, active, locale = "en" }: PublicHeaderProps) {
  const baseRoot = workspace.slug === "demo" ? "/demo" : `/feedback/${workspace.slug}`;
  const root = localizedPath(locale, baseRoot);
  const section = active === "feedback" ? baseRoot : `${baseRoot}/${active}`;
  return (
    <header className="product-topbar">
      <div className="product-brand">
        <span className="wordmark-dot" />
        <div>
          <strong>{workspace.name}</strong>
          <span>{locale === "ru" ? "Работает на Pulseboard" : "Powered by Pulseboard"}</span>
        </div>
      </div>
      <nav className="product-tabs" aria-label={locale === "ru" ? `Навигация отзывов ${workspace.name}` : `${workspace.name} feedback navigation`}>
        <Link href={root} aria-current={active === "feedback" ? "page" : undefined}>{locale === "ru" ? "Отзывы" : "Feedback"}</Link>
        <Link href={`${root}/roadmap`} aria-current={active === "roadmap" ? "page" : undefined}>Roadmap</Link>
        <Link href={`${root}/changelog`} aria-current={active === "changelog" ? "page" : undefined}>{locale === "ru" ? "Обновления" : "Changelog"}</Link>
      </nav>
      <div className="product-header-actions"><LocaleSwitch locale={locale} section={section} />{workspace.isDemo ? (
        <Link href={localizedPath(locale, "/demo/app/map")} className="demo-badge"><CircleDot size={11} /> {locale === "ru" ? "Signal Map" : "Founder view"}</Link>
      ) : (
        <Link href={localizedPath(locale, "/")} className="demo-badge"><ArrowLeft size={11} /> Pulseboard</Link>
      )}</div>
    </header>
  );
}

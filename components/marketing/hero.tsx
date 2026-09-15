"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HeroSignalCanvas } from "@/components/marketing/hero-signal-canvas";
import { LocaleSwitch } from "@/components/locale-switch";
import { localizedPath, marketingCopy, type Locale } from "@/lib/i18n";

export function Hero({ locale = "en" }: { locale?: Locale }) {
  const copy = marketingCopy[locale];
  return (
    <section className="hero" aria-labelledby="hero-title">
      <header className="marketing-nav">
        <Link href={localizedPath(locale, "/")} className="wordmark" aria-label={locale === "ru" ? "Главная Pulseboard" : "Pulseboard home"}>
          <span className="wordmark-dot" />
          Pulseboard
        </Link>
        <nav aria-label={locale === "ru" ? "Основная навигация" : "Main navigation"}>
          <Link href={localizedPath(locale, "/demo")}>{copy.navBoard}</Link>
          <Link href={localizedPath(locale, "/demo/app/map")}>{copy.navDemo}</Link>
          <LocaleSwitch locale={locale} section="/" />
          <Link href={locale === "ru" ? "/login?locale=ru" : "/login"} className="nav-action">
            {copy.navSignIn} <ArrowUpRight size={14} />
          </Link>
        </nav>
      </header>

      <div className="hero-copy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="hero-title">Pulseboard.</h1>
        <p className="hero-promise">
          {copy.promise}
        </p>
        <div className="hero-actions">
          <Link href={localizedPath(locale, "/demo/app/map")} className="button button-primary">
            {copy.primary} <ArrowUpRight size={16} />
          </Link>
          <Link href={locale === "ru" ? "/ru/demo" : "/login"} className="button button-quiet">
            {copy.secondary}
          </Link>
        </div>
      </div>

      <HeroSignalCanvas locale={locale} />
      <div className="hero-caption" aria-hidden="true">
        {copy.captions.map((caption) => <span key={caption}>{caption}</span>)}
      </div>
    </section>
  );
}

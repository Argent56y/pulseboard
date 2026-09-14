import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { localizedPath, marketingCopy, type Locale } from "@/lib/i18n";

export function FinalCta({ locale = "en" }: { locale?: Locale }) {
  const copy = marketingCopy[locale];
  return (
    <footer className="final-cta">
      <div className="final-cta-copy">
        <p className="eyebrow">{copy.finalEyebrow}</p>
        <h2>{copy.finalTitle}</h2>
        <div className="hero-actions">
          <Link href={localizedPath(locale, "/demo/app/map")} className="button button-primary">
            {copy.finalPrimary} <ArrowUpRight size={16} />
          </Link>
          <Link href={locale === "ru" ? "/ru/demo" : "/login"} className="button button-quiet">{copy.finalSecondary}</Link>
        </div>
      </div>
      <div className="site-footer">
        <Link href={localizedPath(locale, "/")} className="wordmark"><span className="wordmark-dot" />Pulseboard</Link>
        <p>{copy.footer}</p>
        <span>© 2026</span>
      </div>
    </footer>
  );
}

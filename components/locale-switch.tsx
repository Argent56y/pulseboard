import Link from "next/link";
import { localizedPath, type Locale } from "@/lib/i18n";

export function LocaleSwitch({ locale, section }: { locale: Locale; section: string }) {
  return <span className="locale-switch" aria-label={locale === "ru" ? "Выбор языка" : "Language selector"}>
    <Link href={localizedPath("ru", section)} aria-current={locale === "ru" ? "page" : undefined}>RU</Link>
    <span>/</span>
    <Link href={localizedPath("en", section)} aria-current={locale === "en" ? "page" : undefined}>EN</Link>
  </span>;
}

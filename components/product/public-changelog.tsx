import type { ChangelogEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export function PublicChangelog({ entries, locale = "en" }: { entries: ChangelogEntry[]; locale?: Locale }) {
  return (
    <div className="changelog-list">
      {entries.map((entry, index) => (
        <article key={entry.id}>
          <div className="change-index">{String(index + 1).padStart(2, "0")}</div>
          <div>
            <time>{entry.publishedAt ? formatDate(entry.publishedAt, locale) : (locale === "ru" ? "Не опубликовано" : "Unpublished")}</time>
            <h2>{entry.title}</h2>
            <p>{entry.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

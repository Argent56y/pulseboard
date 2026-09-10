import type { ChangelogEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function PublicChangelog({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <div className="changelog-list">
      {entries.map((entry, index) => (
        <article key={entry.id}>
          <div className="change-index">{String(index + 1).padStart(2, "0")}</div>
          <div>
            <time>{formatDate(entry.publishedAt)}</time>
            <h2>{entry.title}</h2>
            <p>{entry.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

import type { RoadmapItem } from "@/lib/types";
import { roadmapStatusLabel } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export function PublicRoadmap({ items, locale = "en" }: { items: RoadmapItem[]; locale?: Locale }) {
  const statuses = ["in_progress", "planned", "shipped"] as const;
  return (
    <div className="public-roadmap">
      {statuses.map((status) => (
        <section key={status}>
          <header>
            <span className={`status status-${status}`}>{roadmapStatusLabel(status, locale)}</span>
            <small>{items.filter((item) => item.status === status).length} {locale === "ru" ? "пунктов" : "items"}</small>
          </header>
          <div className="public-roadmap-items">
            {items.filter((item) => item.status === status).map((item) => (
              <article key={item.id}>
                <p className="app-kicker">{item.targetWindow} · {item.feedbackCount} {locale === "ru" ? "сигналов" : "signals"}</p>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

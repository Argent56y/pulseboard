import type { RoadmapItem } from "@/lib/types";
import { roadmapStatusLabel } from "@/lib/utils";

export function PublicRoadmap({ items }: { items: RoadmapItem[] }) {
  const statuses = ["in_progress", "planned", "shipped"] as const;
  return (
    <div className="public-roadmap">
      {statuses.map((status) => (
        <section key={status}>
          <header>
            <span className={`status status-${status}`}>{roadmapStatusLabel(status)}</span>
            <small>{items.filter((item) => item.status === status).length} items</small>
          </header>
          {items.filter((item) => item.status === status).map((item) => (
            <article key={item.id}>
              <p className="app-kicker">{item.targetWindow} · {item.feedbackCount} signals</p>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}

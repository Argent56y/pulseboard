import { ArrowUpRight, Plus } from "lucide-react";
import { createRoadmapItem } from "@/app/actions";
import type { RoadmapItem, RoadmapStatus, Theme, Workspace } from "@/lib/types";

const columns: { status: RoadmapStatus; label: string }[] = [
  { status: "planned", label: "Planned" },
  { status: "in_progress", label: "In progress" },
  { status: "shipped", label: "Shipped" },
];

export function RoadmapBoard({ workspace, items, themes, readOnly = false }: { workspace: Workspace; items: RoadmapItem[]; themes: Theme[]; readOnly?: boolean }) {
  async function submit(formData: FormData) { "use server"; await createRoadmapItem(formData); }
  return <section className="app-section">
    <div className="section-toolbar">
      <div><h2>Product direction</h2><p>Every item keeps the customer themes that earned its place.</p></div>
      {!readOnly && <details className="inline-create"><summary className="button button-small button-primary"><Plus size={13} /> New item</summary><form action={submit} className="popover-form"><input type="hidden" name="workspaceId" value={workspace.id} /><label>Title<input name="title" required minLength={4} /></label><label>Summary<textarea name="summary" required minLength={12} /></label><label>Target window<input name="targetWindow" placeholder="Q4 2026" required /></label><button className="button button-small button-primary" type="submit">Add to roadmap</button></form></details>}
    </div>
    <div className="roadmap-columns">
      {columns.map((column) => {
        const columnItems = items.filter((item) => item.status === column.status);
        return <section className="roadmap-column" key={column.status}><header><span><i className={`roadmap-status-dot dot-${column.status}`} />{column.label}</span><strong>{columnItems.length}</strong></header>{columnItems.map((item) => {
          const relatedThemes = themes.filter((theme) => item.themeIds.includes(theme.id));
          return <article className="roadmap-card" key={item.id}><div className="roadmap-card-top"><span>{item.targetWindow}</span><ArrowUpRight size={13} /></div><h3>{item.title}</h3><p>{item.summary}</p><div className="theme-chips">{relatedThemes.map((theme) => <span key={theme.id}>{theme.name}</span>)}</div><footer><span>{item.feedbackCount} signals</span><span>{relatedThemes.length} themes</span></footer></article>;
        })}{!columnItems.length && <div className="column-empty">No items yet</div>}</section>;
      })}
    </div>
  </section>;
}

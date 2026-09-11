"use client";

import { ArrowDown, ArrowUp, ArrowUpRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { changeRoadmapStatus, createRoadmapItem, deleteRoadmapItem, reorderRoadmapItems, updateRoadmapItem } from "@/app/actions";
import type { RoadmapItem, RoadmapStatus, Theme, Workspace } from "@/lib/types";

const columns: { status: RoadmapStatus; label: string }[] = [{ status: "planned", label: "Planned" }, { status: "in_progress", label: "In progress" }, { status: "shipped", label: "Shipped" }];

export function RoadmapBoard({ workspace, items: initialItems, themes, initialSelected, readOnly = false }: { workspace: Workspace; items: RoadmapItem[]; themes: Theme[]; initialSelected?: string; readOnly?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<RoadmapItem | null>(initialItems.find((item) => item.id === initialSelected) ?? null);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => { const result = await task(); setNotice(result.message); if (result.ok) router.refresh(); });
  }

  async function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    startTransition(async () => { const result = await createRoadmapItem(data); setNotice(result.message); if (result.ok) { form.reset(); router.refresh(); } });
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    startTransition(async () => { const result = await updateRoadmapItem(data); setNotice(result.message); if (result.ok) { setEditing(null); router.refresh(); } });
  }

  async function setStatus(item: RoadmapItem, status: RoadmapStatus) {
    if (readOnly) { setNotice("The demo roadmap is read-only."); return; }
    startTransition(async () => {
      let result = await changeRoadmapStatus({ itemId: item.id, status, confirmed: false });
      if (!result.ok && result.value && window.confirm(`${result.value} linked feedback items will also move to “${status.replace("_", " ")}”. Continue?`)) {
        result = await changeRoadmapStatus({ itemId: item.id, status, confirmed: true });
      }
      setNotice(result.message); if (result.ok) router.refresh();
    });
  }

  function move(itemId: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === itemId); const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; setItems(next);
    run(() => reorderRoadmapItems(workspace.id, next.map((item) => item.id)));
  }

  return <section className="app-section">
    <div className="section-toolbar"><div><h2>Product direction</h2><p>Every item keeps the customer themes that earned its place.</p></div>{!readOnly && <details className="inline-create"><summary className="button button-small button-primary"><Plus size={13} /> New item</summary><form onSubmit={submitNew} className="popover-form"><input type="hidden" name="workspaceId" value={workspace.id} /><label>Title<input name="title" required minLength={4} /></label><label>Summary<textarea name="summary" required minLength={12} /></label><label>Target window<input name="targetWindow" placeholder="Q4 2026" required /></label><fieldset><legend>Evidence themes</legend>{themes.map((theme) => <label className="checkbox-row" key={theme.id}><input type="checkbox" name="themeIds" value={theme.id} /> {theme.name}</label>)}</fieldset><button className="button button-small button-primary" disabled={pending} type="submit">Add to roadmap</button></form></details>}</div>
    {notice && <p className="inline-notice" role="status">{notice}</p>}
    <div className="roadmap-columns">{columns.map((column) => { const columnItems = items.filter((item) => item.status === column.status); return <section className="roadmap-column" key={column.status}><header><span><i className={`roadmap-status-dot dot-${column.status}`} />{column.label}</span><strong>{columnItems.length}</strong></header>{columnItems.map((item) => { const relatedThemes = themes.filter((theme) => item.themeIds.includes(theme.id)); const globalIndex = items.findIndex((candidate) => candidate.id === item.id); return <article className="roadmap-card" key={item.id}><div className="roadmap-card-top"><span>{item.targetWindow}</span><ArrowUpRight size={13} /></div><h3>{item.title}</h3><p>{item.summary}</p><div className="theme-chips">{relatedThemes.map((theme) => <span key={theme.id}>{theme.name}</span>)}</div><footer><span>{item.feedbackCount} signals</span><span>{relatedThemes.length} themes</span></footer>{!readOnly && <div className="roadmap-card-actions"><select value={item.status} disabled={pending} onChange={(event) => setStatus(item, event.target.value as RoadmapStatus)} aria-label={`Status for ${item.title}`}>{columns.map((option) => <option value={option.status} key={option.status}>{option.label}</option>)}</select><button type="button" disabled={globalIndex === 0 || pending} onClick={() => move(item.id, -1)} aria-label="Move earlier"><ArrowUp size={12} /></button><button type="button" disabled={globalIndex === items.length - 1 || pending} onClick={() => move(item.id, 1)} aria-label="Move later"><ArrowDown size={12} /></button><button type="button" onClick={() => setEditing(item)} aria-label="Edit item"><Pencil size={12} /></button><button type="button" onClick={() => { if (window.confirm(`Delete “${item.title}”?`)) run(() => deleteRoadmapItem(item.id)); }} aria-label="Delete item"><Trash2 size={12} /></button></div>}</article>; })}{!columnItems.length && <div className="column-empty">No items yet</div>}</section>; })}</div>
    {editing && <div className="import-overlay"><section className="edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-roadmap-title"><header><div><span className="app-kicker">Edit roadmap item</span><h2 id="edit-roadmap-title">Keep the decision explainable.</h2></div><button className="icon-button" type="button" onClick={() => setEditing(null)}><X size={15} /></button></header><form onSubmit={submitEdit} className="form-stack"><input type="hidden" name="workspaceId" value={workspace.id} /><input type="hidden" name="itemId" value={editing.id} /><div className="form-field"><label>Title</label><input name="title" defaultValue={editing.title} minLength={4} required /></div><div className="form-field"><label>Summary</label><textarea name="summary" defaultValue={editing.summary} minLength={12} required /></div><div className="form-field"><label>Target window</label><input name="targetWindow" defaultValue={editing.targetWindow} required /></div><fieldset><legend>Linked themes</legend>{themes.map((theme) => <label className="checkbox-row" key={theme.id}><input type="checkbox" name="themeIds" value={theme.id} defaultChecked={editing.themeIds.includes(theme.id)} /> {theme.name}</label>)}</fieldset><button className="button button-primary" disabled={pending}>Save changes</button></form></section></div>}
  </section>;
}

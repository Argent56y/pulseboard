"use client";

import { ArrowDown, ArrowUp, ArrowUpRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { changeRoadmapStatus, createRoadmapItem, deleteRoadmapItem, reorderRoadmapItems, updateRoadmapItem } from "@/app/actions";
import type { RoadmapItem, RoadmapStatus, Theme, Workspace } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { roadmapStatusLabel } from "@/lib/utils";

const statuses: RoadmapStatus[] = ["planned", "in_progress", "shipped"];

export function RoadmapBoard({ workspace, items: initialItems, themes, initialSelected, readOnly = false, locale = "en" }: { workspace: Workspace; items: RoadmapItem[]; themes: Theme[]; initialSelected?: string; readOnly?: boolean; locale?: Locale }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<RoadmapItem | null>(initialItems.find((item) => item.id === initialSelected) ?? null);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const columns = statuses.map((status) => ({ status, label: roadmapStatusLabel(status, locale) }));
  const copy = locale === "ru" ? {
    heading: "Направление продукта", description: "Каждый пункт сохраняет темы клиентов, которые объясняют его приоритет.", newItem: "Новый пункт",
    title: "Название", summary: "Описание", target: "Период", themes: "Темы-доказательства", add: "Добавить в roadmap",
    signals: "сигналов", themeCount: "тем", empty: "Пока нет пунктов", edit: "Редактирование roadmap", explainable: "Сохраните решение понятным.", linked: "Связанные темы", save: "Сохранить",
    readOnly: "Демо-roadmap доступен только для чтения.", confirm: "связанных отзывов также изменят статус. Продолжить?", delete: "Удалить",
  } : {
    heading: "Product direction", description: "Every item keeps the customer themes that earned its place.", newItem: "New item",
    title: "Title", summary: "Summary", target: "Target window", themes: "Evidence themes", add: "Add to roadmap",
    signals: "signals", themeCount: "themes", empty: "No items yet", edit: "Edit roadmap item", explainable: "Keep the decision explainable.", linked: "Linked themes", save: "Save changes",
    readOnly: "The demo roadmap is read-only.", confirm: "linked feedback items will also change status. Continue?", delete: "Delete",
  };

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
    if (readOnly) { setNotice(copy.readOnly); return; }
    startTransition(async () => {
      let result = await changeRoadmapStatus({ itemId: item.id, status, confirmed: false });
      if (!result.ok && result.value && window.confirm(`${result.value} ${copy.confirm}`)) {
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
    <div className="section-toolbar"><div><h2>{copy.heading}</h2><p>{copy.description}</p></div>{!readOnly && <details className="inline-create"><summary className="button button-small button-primary"><Plus size={13} /> {copy.newItem}</summary><form onSubmit={submitNew} className="popover-form"><input type="hidden" name="workspaceId" value={workspace.id} /><label>{copy.title}<input name="title" required minLength={4} /></label><label>{copy.summary}<textarea name="summary" required minLength={12} /></label><label>{copy.target}<input name="targetWindow" placeholder="Q4 2026" required /></label><fieldset><legend>{copy.themes}</legend>{themes.map((theme) => <label className="checkbox-row" key={theme.id}><input type="checkbox" name="themeIds" value={theme.id} /> {theme.name}</label>)}</fieldset><button className="button button-small button-primary" disabled={pending} type="submit">{copy.add}</button></form></details>}</div>
    {notice && <p className="inline-notice" role="status">{notice}</p>}
    <div className="roadmap-columns">{columns.map((column) => { const columnItems = items.filter((item) => item.status === column.status); return <section className="roadmap-column" key={column.status}><header><span><i className={`roadmap-status-dot dot-${column.status}`} />{column.label}</span><strong>{columnItems.length}</strong></header>{columnItems.map((item) => { const relatedThemes = themes.filter((theme) => item.themeIds.includes(theme.id)); const globalIndex = items.findIndex((candidate) => candidate.id === item.id); return <article className="roadmap-card" key={item.id}><div className="roadmap-card-top"><span>{item.targetWindow}</span><ArrowUpRight size={13} /></div><h3>{item.title}</h3><p>{item.summary}</p><div className="theme-chips">{relatedThemes.map((theme) => <span key={theme.id}>{theme.name}</span>)}</div><footer><span>{item.feedbackCount} {copy.signals}</span><span>{relatedThemes.length} {copy.themeCount}</span></footer>{!readOnly && <div className="roadmap-card-actions"><select value={item.status} disabled={pending} onChange={(event) => setStatus(item, event.target.value as RoadmapStatus)} aria-label={`${column.label}: ${item.title}`}>{columns.map((option) => <option value={option.status} key={option.status}>{option.label}</option>)}</select><button type="button" disabled={globalIndex === 0 || pending} onClick={() => move(item.id, -1)} aria-label="Move earlier"><ArrowUp size={12} /></button><button type="button" disabled={globalIndex === items.length - 1 || pending} onClick={() => move(item.id, 1)} aria-label="Move later"><ArrowDown size={12} /></button><button type="button" onClick={() => setEditing(item)} aria-label="Edit item"><Pencil size={12} /></button><button type="button" onClick={() => { if (window.confirm(`${copy.delete} “${item.title}”?`)) run(() => deleteRoadmapItem(item.id)); }} aria-label={copy.delete}><Trash2 size={12} /></button></div>}</article>; })}{!columnItems.length && <div className="column-empty">{copy.empty}</div>}</section>; })}</div>
    {editing && <div className="import-overlay"><section className="edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-roadmap-title"><header><div><span className="app-kicker">{copy.edit}</span><h2 id="edit-roadmap-title">{copy.explainable}</h2></div><button className="icon-button" type="button" onClick={() => setEditing(null)}><X size={15} /></button></header><form onSubmit={submitEdit} className="form-stack"><input type="hidden" name="workspaceId" value={workspace.id} /><input type="hidden" name="itemId" value={editing.id} /><div className="form-field"><label>{copy.title}</label><input name="title" defaultValue={editing.title} minLength={4} required /></div><div className="form-field"><label>{copy.summary}</label><textarea name="summary" defaultValue={editing.summary} minLength={12} required /></div><div className="form-field"><label>{copy.target}</label><input name="targetWindow" defaultValue={editing.targetWindow} required /></div><fieldset><legend>{copy.linked}</legend>{themes.map((theme) => <label className="checkbox-row" key={theme.id}><input type="checkbox" name="themeIds" value={theme.id} defaultChecked={editing.themeIds.includes(theme.id)} /> {theme.name}</label>)}</fieldset><button className="button button-primary" disabled={pending}>{copy.save}</button></form></section></div>}
  </section>;
}

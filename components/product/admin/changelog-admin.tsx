"use client";

import { Calendar, Eye, Megaphone, Pencil, Send, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { saveChangelog, setChangelogPublished } from "@/app/actions";
import type { ChangelogEntry, RoadmapItem, Workspace } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import type { Locale } from "@/lib/i18n";

export function ChangelogAdmin({ workspace, entries, roadmap = [], readOnly = false, locale = "en" }: { workspace: Workspace; entries: ChangelogEntry[]; roadmap?: RoadmapItem[]; readOnly?: boolean; locale?: Locale }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ChangelogEntry | null>(null);
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "", roadmapItemId: "" });
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const published = entries.filter((entry) => entry.publishedAt);
  const drafts = entries.filter((entry) => !entry.publishedAt);
  const copy = locale === "ru" ? {
    heading: "Обновления продукта", description: "Подготовьте, проверьте и опубликуйте заметки о выпущенных функциях.", live: "опубликовано", drafts: "черновиков", draft: "Черновики", hidden: "Не видно клиентам", edit: "Изменить", unpublish: "Снять с публикации",
    empty: "Пока нет опубликованных обновлений.", emptyHint: "Выпустите пункт roadmap, затем расскажите о результате здесь.",
    editNote: "Редактирование обновления", newNote: "Новое обновление", title: "Расскажите клиентам, что изменилось.", body: "Пишите просто, свяжите решение с доказательствами и покажите пользу.", disabled: "В демо публикация отключена.", disabledHint: "Создайте workspace, чтобы публиковать собственные обновления.",
    previewLabel: "Предпросмотр", untitled: "Обновление без названия", previewEmpty: "Текст обновления появится здесь.", back: "Вернуться к редактору", titleLabel: "Заголовок", roadmapLabel: "Выпущенный пункт roadmap", noItem: "Без связи", bodyLabel: "Что изменилось", preview: "Предпросмотр", save: "Сохранить черновик", publish: "Опубликовать",
  } : {
    heading: "Release communication", description: "Draft, preview and publish updates tied to shipped work.", live: "live", drafts: "drafts", draft: "Drafts", hidden: "Not visible to customers", edit: "Edit", unpublish: "Unpublish",
    empty: "No published updates yet.", emptyHint: "Ship a roadmap item, then close the loop here.",
    editNote: "Edit release note", newNote: "New release note", title: "Tell customers what changed.", body: "Write plainly, link the decision back to evidence, and make the benefit obvious.", disabled: "Publishing is disabled in the demo.", disabledHint: "Create a workspace to ship your own updates.",
    previewLabel: "Customer preview", untitled: "Untitled update", previewEmpty: "Your release note will appear here.", back: "Back to editor", titleLabel: "Title", roadmapLabel: "Shipped roadmap item", noItem: "No linked item", bodyLabel: "What changed", preview: "Preview", save: "Save draft", publish: "Publish",
  };

  function selectEntry(entry: ChangelogEntry) {
    setEditing(entry); setDraft({ title: entry.title, body: entry.body, roadmapItemId: entry.roadmapItemId ?? "" }); setPreview(false);
  }

  function submit(event: FormEvent<HTMLFormElement>, publish: boolean) {
    event.preventDefault(); const formData = new FormData(); formData.set("workspaceId", workspace.id); if (editing) formData.set("id", editing.id); if (draft.roadmapItemId) formData.set("roadmapItemId", draft.roadmapItemId); formData.set("title", draft.title); formData.set("body", draft.body); formData.set("publish", String(publish));
    startTransition(async () => { const result = await saveChangelog(formData); setNotice(result.message); if (result.ok) { setEditing(null); setDraft({ title: "", body: "", roadmapItemId: "" }); setPreview(false); router.refresh(); } });
  }

  function togglePublished(entry: ChangelogEntry, publish: boolean) {
    startTransition(async () => { const result = await setChangelogPublished(entry.id, publish); setNotice(result.message); if (result.ok) router.refresh(); });
  }

  return <section className="app-section changelog-admin-grid">
    <div><div className="section-toolbar"><div><h2>{copy.heading}</h2><p>{copy.description}</p></div><span className="table-count">{published.length} {copy.live} · {drafts.length} {copy.drafts}</span></div><InlineFeedback message={notice} />
      {drafts.length > 0 && <section className="draft-list"><span className="app-kicker">{copy.draft}</span>{drafts.map((entry) => <article key={entry.id}><div><strong>{entry.title}</strong><span>{copy.hidden}</span></div>{!readOnly && <button type="button" onClick={() => selectEntry(entry)}><Pencil size={13} /> {copy.edit}</button>}</article>)}</section>}
      <div className="admin-release-list">{published.map((entry, index) => <article key={entry.id}><span className="release-number">{String(index + 1).padStart(2, "0")}</span><div><div className="release-meta"><Calendar size={11} /> {formatDate(entry.publishedAt!, locale)}</div><h3>{entry.title}</h3><p>{entry.body}</p>{!readOnly && <div className="release-actions"><button type="button" onClick={() => selectEntry(entry)}><Pencil size={12} /> {copy.edit}</button><button type="button" disabled={pending} onClick={() => togglePublished(entry, false)}><Undo2 size={12} /> {copy.unpublish}</button></div>}</div></article>)}</div>{!published.length && <div className="empty-state"><strong>{copy.empty}</strong><span>{copy.emptyHint}</span></div>}
    </div>
    <aside className="composer-panel"><div className="composer-heading"><div><span className="app-kicker">{editing ? copy.editNote : copy.newNote}</span><h2>{copy.title}</h2></div>{editing && <button className="icon-button" type="button" onClick={() => { setEditing(null); setDraft({ title: "", body: "", roadmapItemId: "" }); }}><X size={14} /></button>}</div><p>{copy.body}</p>
      {readOnly ? <div className="demo-callout"><Megaphone size={18} /><strong>{copy.disabled}</strong><span>{copy.disabledHint}</span></div> : preview ? <div className="changelog-preview"><span className="app-kicker">{copy.previewLabel}</span><h3>{draft.title || copy.untitled}</h3><p>{draft.body || copy.previewEmpty}</p><button className="button button-outline" type="button" onClick={() => setPreview(false)}>{copy.back}</button></div> : <form onSubmit={(event) => submit(event, false)} className="form-stack"><div className="form-field"><label htmlFor="change-title">{copy.titleLabel}</label><input id="change-title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} minLength={4} required placeholder="A clearer weekly digest" /></div><div className="form-field"><label htmlFor="change-roadmap">{copy.roadmapLabel}</label><select id="change-roadmap" value={draft.roadmapItemId} onChange={(event) => setDraft((current) => ({ ...current, roadmapItemId: event.target.value }))}><option value="">{copy.noItem}</option>{roadmap.filter((item) => item.status === "shipped").map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div><div className="form-field"><label htmlFor="change-body">{copy.bodyLabel}</label><textarea id="change-body" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} minLength={12} required placeholder="Explain what customers can do now and why it matters." /></div><div className="composer-actions"><button className="button button-outline" type="button" onClick={() => setPreview(true)}><Eye size={13} /> {copy.preview}</button><button className="button button-outline" disabled={pending} type="submit">{copy.save}</button><button className="button button-primary" disabled={pending} type="button" onClick={(event) => submit(event as unknown as FormEvent<HTMLFormElement>, true)}><Send size={13} /> {copy.publish}</button></div></form>}
    </aside>
  </section>;
}

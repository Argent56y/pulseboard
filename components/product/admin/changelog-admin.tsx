"use client";

import { Calendar, Eye, Megaphone, Pencil, Send, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { saveChangelog, setChangelogPublished } from "@/app/actions";
import type { ChangelogEntry, RoadmapItem, Workspace } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ChangelogAdmin({ workspace, entries, roadmap = [], readOnly = false }: { workspace: Workspace; entries: ChangelogEntry[]; roadmap?: RoadmapItem[]; readOnly?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ChangelogEntry | null>(null);
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "", roadmapItemId: "" });
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const published = entries.filter((entry) => entry.publishedAt);
  const drafts = entries.filter((entry) => !entry.publishedAt);

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
    <div><div className="section-toolbar"><div><h2>Release communication</h2><p>Draft, preview and publish updates tied to shipped work.</p></div><span className="table-count">{published.length} live · {drafts.length} drafts</span></div>{notice && <p className="inline-notice" role="status">{notice}</p>}
      {drafts.length > 0 && <section className="draft-list"><span className="app-kicker">Drafts</span>{drafts.map((entry) => <article key={entry.id}><div><strong>{entry.title}</strong><span>Not visible to customers</span></div><button type="button" onClick={() => selectEntry(entry)}><Pencil size={13} /> Edit</button></article>)}</section>}
      <div className="admin-release-list">{published.map((entry, index) => <article key={entry.id}><span className="release-number">{String(index + 1).padStart(2, "0")}</span><div><div className="release-meta"><Calendar size={11} /> {formatDate(entry.publishedAt!)}</div><h3>{entry.title}</h3><p>{entry.body}</p><div className="release-actions"><button type="button" onClick={() => selectEntry(entry)}><Pencil size={12} /> Edit</button><button type="button" disabled={pending} onClick={() => togglePublished(entry, false)}><Undo2 size={12} /> Unpublish</button></div></div></article>)}</div>{!published.length && <div className="empty-state"><strong>No published updates yet.</strong><span>Ship a roadmap item, then close the loop here.</span></div>}
    </div>
    <aside className="composer-panel"><div className="composer-heading"><div><span className="app-kicker">{editing ? "Edit release note" : "New release note"}</span><h2>Tell customers what changed.</h2></div>{editing && <button className="icon-button" type="button" onClick={() => { setEditing(null); setDraft({ title: "", body: "", roadmapItemId: "" }); }}><X size={14} /></button>}</div><p>Write plainly, link the decision back to evidence, and make the benefit obvious.</p>
      {readOnly ? <div className="demo-callout"><Megaphone size={18} /><strong>Publishing is disabled in the demo.</strong><span>Create a workspace to ship your own updates.</span></div> : preview ? <div className="changelog-preview"><span className="app-kicker">Customer preview</span><h3>{draft.title || "Untitled update"}</h3><p>{draft.body || "Your release note will appear here."}</p><button className="button button-outline" type="button" onClick={() => setPreview(false)}>Back to editor</button></div> : <form onSubmit={(event) => submit(event, false)} className="form-stack"><div className="form-field"><label htmlFor="change-title">Title</label><input id="change-title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} minLength={4} required placeholder="A clearer weekly digest" /></div><div className="form-field"><label htmlFor="change-roadmap">Shipped roadmap item</label><select id="change-roadmap" value={draft.roadmapItemId} onChange={(event) => setDraft((current) => ({ ...current, roadmapItemId: event.target.value }))}><option value="">No linked item</option>{roadmap.filter((item) => item.status === "shipped").map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div><div className="form-field"><label htmlFor="change-body">What changed</label><textarea id="change-body" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} minLength={12} required placeholder="Explain what customers can do now and why it matters." /></div><div className="composer-actions"><button className="button button-outline" type="button" onClick={() => setPreview(true)}><Eye size={13} /> Preview</button><button className="button button-outline" disabled={pending} type="submit">Save draft</button><button className="button button-primary" disabled={pending} type="button" onClick={(event) => submit(event as unknown as FormEvent<HTMLFormElement>, true)}><Send size={13} /> Publish</button></div></form>}
    </aside>
  </section>;
}

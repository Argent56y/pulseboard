import { Calendar, Megaphone } from "lucide-react";
import { publishChangelog } from "@/app/actions";
import type { ChangelogEntry, Workspace } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ChangelogAdmin({ workspace, entries, readOnly = false }: { workspace: Workspace; entries: ChangelogEntry[]; readOnly?: boolean }) {
  async function submit(formData: FormData) { "use server"; await publishChangelog(formData); }
  return <section className="app-section changelog-admin-grid">
    <div>
      <div className="section-toolbar"><div><h2>Published updates</h2><p>Close the loop with the people who asked.</p></div><span className="table-count">{entries.length} live</span></div>
      <div className="admin-release-list">{entries.map((entry, index) => <article key={entry.id}><span className="release-number">{String(index + 1).padStart(2, "0")}</span><div><div className="release-meta"><Calendar size={11} /> {formatDate(entry.publishedAt)}</div><h3>{entry.title}</h3><p>{entry.body}</p></div></article>)}</div>
    </div>
    <aside className="composer-panel">
      <span className="app-kicker">New release note</span><h2>Tell customers what changed.</h2><p>Write plainly, link the decision back to evidence, and make the benefit obvious.</p>
      {readOnly ? <div className="demo-callout"><Megaphone size={18} /><strong>Publishing is disabled in the demo.</strong><span>Create a workspace to ship your own updates.</span></div> : <form action={submit} className="form-stack"><input type="hidden" name="workspaceId" value={workspace.id} /><div className="form-field"><label htmlFor="change-title">Title</label><input id="change-title" name="title" minLength={4} required placeholder="A clearer weekly digest" /></div><div className="form-field"><label htmlFor="change-body">What changed</label><textarea id="change-body" name="body" minLength={12} required placeholder="Explain what customers can do now and why it matters." /></div><button className="button button-primary" type="submit">Publish update</button></form>}
    </aside>
  </section>;
}

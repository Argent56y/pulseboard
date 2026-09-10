import { Copy, LockKeyhole, Plus, Users } from "lucide-react";
import { createInvite, createTheme } from "@/app/actions";
import type { Theme, Workspace } from "@/lib/types";

export function SettingsPanel({ workspace, themes }: { workspace: Workspace; themes: Theme[] }) {
  async function submitTheme(formData: FormData) { "use server"; await createTheme(formData); }
  async function submitInvite(formData: FormData) { "use server"; await createInvite(formData); }

  return <section className="app-section settings-grid">
    <div>
      <div className="settings-section">
        <h2>Public board</h2><p>What customers see when they share ideas and follow your roadmap.</p>
        <div className="form-stack">
          <div className="form-field"><label>Workspace name</label><input defaultValue={workspace.name} readOnly /></div>
          <div className="form-field"><label>Public URL</label><div className="copy-field"><input value={`/feedback/${workspace.slug}`} readOnly /><button type="button" aria-label="Copy public URL"><Copy size={14} /></button></div></div>
          <div className="form-field"><label>Description</label><textarea defaultValue={workspace.description} readOnly /></div>
        </div>
      </div>
      <div className="settings-section">
        <h2>Signal themes</h2><p>Human-readable clusters used by the map and roadmap.</p>
        <div className="settings-theme-list">{themes.map((theme) => <div key={theme.id}><span>{theme.name}</span><small>{theme.signalCount} signals</small></div>)}</div>
        <details className="inline-create"><summary className="button button-small button-outline"><Plus size={13} /> Add theme</summary><form action={submitTheme} className="popover-form"><input type="hidden" name="workspaceId" value={workspace.id} /><label>Name<input name="name" required minLength={3} /></label><label>Description<textarea name="description" required minLength={8} /></label><button className="button button-small button-primary" type="submit">Create theme</button></form></details>
      </div>
    </div>
    <aside>
      <div className="settings-section">
        <h2><Users size={16} /> Members</h2><p>Invite editors to triage feedback and maintain the roadmap.</p>
        <div className="member-row"><span className="avatar-small">SD</span><div><strong>Seva Dev-a</strong><small>Owner</small></div></div>
        <form action={submitInvite} className="form-stack invite-form"><input type="hidden" name="workspaceId" value={workspace.id} /><div className="form-field"><label>Invite role</label><select name="role"><option value="editor">Editor</option><option value="owner">Owner</option></select></div><button className="button button-primary" type="submit">Create invite link</button></form>
      </div>
      <div className="security-note"><LockKeyhole size={16} /><div><strong>Workspace isolation</strong><p>Membership and row-level policies protect every private record.</p></div></div>
    </aside>
  </section>;
}

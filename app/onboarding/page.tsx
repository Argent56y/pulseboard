import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createWorkspace } from "@/app/actions";

export default function OnboardingPage() {
  async function submit(formData: FormData) {
    "use server";
    await createWorkspace(formData);
  }

  return <main className="onboarding-page">
    <Link className="wordmark" href="/"><span className="wordmark-dot" />Pulseboard</Link>
    <section>
      <span className="app-kicker">Your first workspace</span>
      <h1>Give customer signals a home.</h1>
      <p>Choose a clear name and URL. You can change the board copy and invite editors later.</p>
      <form action={submit} className="form-stack onboarding-form">
        <div className="form-field"><label htmlFor="workspace-name">Workspace name</label><input id="workspace-name" name="name" required minLength={2} placeholder="Acme Product" /></div>
        <div className="form-field"><label htmlFor="workspace-slug">Public URL</label><div className="slug-field"><span>pulseboard.app/feedback/</span><input id="workspace-slug" name="slug" required minLength={3} pattern="[a-z0-9-]+" placeholder="acme" /></div><span className="form-hint">Lowercase letters, numbers and hyphens only.</span></div>
        <button className="button button-primary" type="submit">Create workspace <ArrowRight size={15} /></button>
      </form>
      <Link className="demo-text-link" href="/demo/app/map">Explore the sample workspace first →</Link>
    </section>
  </main>;
}

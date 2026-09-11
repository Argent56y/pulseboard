"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { createWorkspace, type ActionResult } from "@/app/actions";

const initialState: ActionResult = { ok: false, message: "" };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(
    async (_state: ActionResult, formData: FormData) => createWorkspace(formData),
    initialState,
  );

  return <form action={action} className="form-stack onboarding-form">
    <div className="form-field"><label htmlFor="workspace-name">Workspace name</label><input id="workspace-name" name="name" required minLength={2} maxLength={60} placeholder="Acme Product" /></div>
    <div className="form-field"><label htmlFor="workspace-slug">Public URL</label><div className="slug-field"><span>/feedback/</span><input id="workspace-slug" name="slug" required minLength={3} maxLength={40} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="acme" /></div><span className="form-hint">Lowercase letters, numbers and single hyphens.</span></div>
    {state.message && <p className="form-hint" role="alert">{state.message}</p>}
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Creating…" : <>Create workspace <ArrowRight size={15} /></>}</button>
  </form>;
}

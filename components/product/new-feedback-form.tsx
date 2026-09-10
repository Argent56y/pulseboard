"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createFeedback, type ActionResult } from "@/app/actions";
import type { Workspace } from "@/lib/types";

const initialState: ActionResult = { ok: false, message: "" };

export function NewFeedbackForm({ workspace, boardId }: { workspace: Workspace; boardId: string }) {
  const [state, action, pending] = useActionState(
    async (_state: ActionResult, formData: FormData) => createFeedback(formData),
    initialState,
  );

  if (workspace.isDemo) {
    return (
      <Link href="/login?next=/onboarding" className="button button-primary">
        Suggest an idea
      </Link>
    );
  }

  return (
    <details className="feedback-composer">
      <summary className="button button-primary">Suggest an idea</summary>
      <form action={action} className="feedback-composer-panel form-stack">
        <input type="hidden" name="workspaceId" value={workspace.id} />
        <input type="hidden" name="boardId" value={boardId} />
        <div className="form-field">
          <label htmlFor="feedback-title">Short title</label>
          <input id="feedback-title" name="title" minLength={6} maxLength={120} required />
        </div>
        <div className="form-field">
          <label htmlFor="feedback-body">What would this help you do?</label>
          <textarea id="feedback-body" name="body" minLength={12} maxLength={2000} required />
        </div>
        {state.message && <p className="form-hint" role="status">{state.message}</p>}
        <button className="button button-primary" disabled={pending}>
          {pending ? "Submitting…" : "Submit feedback"}
        </button>
      </form>
    </details>
  );
}

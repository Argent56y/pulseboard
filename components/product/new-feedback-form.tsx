"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createFeedback, findPotentialDuplicates } from "@/app/actions";
import { rememberPendingAction } from "@/lib/pending-actions";
import type { DuplicateCandidate, Workspace } from "@/lib/types";
import { feedbackStatusLabel } from "@/lib/utils";

export function NewFeedbackForm({ workspace, boardId }: { workspace: Workspace; boardId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  if (workspace.isDemo) {
    return <Link href="/login?next=/onboarding" className="button button-primary">Suggest an idea</Link>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    if (!checked) {
      const matches = await findPotentialDuplicates({ workspaceId: workspace.id, title, body });
      const nextCandidates = matches.value ?? [];
      setCandidates(nextCandidates);
      setChecked(true);
      if (nextCandidates.length) {
        setMessage(matches.message);
        setPending(false);
        return;
      }
    }

    const formData = new FormData();
    formData.set("workspaceId", workspace.id);
    formData.set("boardId", boardId);
    formData.set("title", title);
    formData.set("body", body);
    const result = await createFeedback(formData);
    if (!result.ok && result.message.includes("Sign in")) {
      rememberPendingAction({ type: "feedback", workspaceId: workspace.id, boardId, title, body, returnTo: pathname });
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setMessage(result.message);
    if (result.ok) {
      setTitle("");
      setBody("");
      setCandidates([]);
      setChecked(false);
      router.refresh();
    }
    setPending(false);
  }

  function editTitle(value: string) { setTitle(value); setChecked(false); setCandidates([]); }
  function editBody(value: string) { setBody(value); setChecked(false); setCandidates([]); }

  return <details className="feedback-composer">
    <summary className="button button-primary">Suggest an idea</summary>
    <form onSubmit={submit} className="feedback-composer-panel form-stack">
      <div className="form-field"><label htmlFor="feedback-title">Short title</label><input id="feedback-title" value={title} onChange={(event) => editTitle(event.target.value)} minLength={6} maxLength={120} required /></div>
      <div className="form-field"><label htmlFor="feedback-body">What would this help you do?</label><textarea id="feedback-body" value={body} onChange={(event) => editBody(event.target.value)} minLength={12} maxLength={2000} required /></div>
      {candidates.length > 0 && <section className="duplicate-preview" aria-labelledby="duplicate-heading">
        <div><span className="app-kicker">Before you post</span><h3 id="duplicate-heading">Could one of these be your idea?</h3></div>
        {candidates.map((candidate) => <Link key={candidate.id} href={`/feedback/${workspace.slug}/post/${candidate.id}`}>
          <span><strong>{candidate.title}</strong><small>{candidate.votes} votes · {feedbackStatusLabel(candidate.status)}</small></span><span>Open →</span>
        </Link>)}
      </section>}
      {message && <p className="form-hint" role="status">{message}</p>}
      <button className="button button-primary" disabled={pending}>{pending ? "Working…" : candidates.length ? "Post as a new idea anyway" : checked ? "Submit feedback" : "Check and continue"}</button>
    </form>
  </details>;
}

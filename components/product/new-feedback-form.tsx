"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { createFeedback, findPotentialDuplicates } from "@/app/actions";
import { rememberPendingAction } from "@/lib/pending-actions";
import type { DuplicateCandidate, Workspace } from "@/lib/types";
import { feedbackStatusLabel } from "@/lib/utils";

export function NewFeedbackForm({ workspace, boardId }: { workspace: Workspace; boardId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"neutral" | "error" | "success">("neutral");

  if (workspace.isDemo) {
    return <Link href="/login?next=/onboarding" className="button button-primary">Suggest an idea</Link>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setMessageTone("neutral");
    if (!checked) {
      const matches = await findPotentialDuplicates({ workspaceId: workspace.id, title, body });
      if (!matches.ok) {
        setMessage(matches.message);
        setMessageTone("error");
        setPending(false);
        return;
      }
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
    setMessageTone(result.ok ? "success" : "error");
    if (result.ok) {
      setTitle("");
      setBody("");
      setCandidates([]);
      setChecked(false);
      detailsRef.current?.removeAttribute("open");
      if (result.value) {
        router.push(`${pathname.replace(/\/$/, "")}/post/${result.value}`);
      } else {
        router.refresh();
      }
    }
    setPending(false);
  }

  function editTitle(value: string) { setTitle(value); setChecked(false); setCandidates([]); }
  function editBody(value: string) { setBody(value); setChecked(false); setCandidates([]); }

  return <details ref={detailsRef} className="feedback-composer">
    <summary className="button button-primary">Suggest an idea</summary>
    <form onSubmit={submit} className="feedback-composer-panel form-stack">
      <header className="feedback-composer-header"><div><span className="app-kicker">New feedback</span><h2>Suggest an idea</h2></div><button type="button" className="composer-close" onClick={() => detailsRef.current?.removeAttribute("open")} aria-label="Close feedback form">×</button></header>
      <div className="form-field"><div className="field-label-row"><label htmlFor="feedback-title">Short title</label><span>{title.length}/120</span></div><input id="feedback-title" value={title} onChange={(event) => editTitle(event.target.value)} minLength={6} maxLength={120} autoComplete="off" placeholder="What should change?" required /></div>
      <div className="form-field"><div className="field-label-row"><label htmlFor="feedback-body">What would this help you do?</label><span>{body.length}/2000</span></div><textarea id="feedback-body" value={body} onChange={(event) => editBody(event.target.value)} minLength={12} maxLength={2000} placeholder="Describe the problem and why it matters." required /></div>
      {candidates.length > 0 && <section className="duplicate-preview" aria-labelledby="duplicate-heading">
        <div><span className="app-kicker">Before you post</span><h3 id="duplicate-heading">Could one of these be your idea?</h3></div>
        {candidates.map((candidate) => <Link key={candidate.id} href={`/feedback/${workspace.slug}/post/${candidate.id}`}>
          <span><strong>{candidate.title}</strong><small>{candidate.votes} votes · {feedbackStatusLabel(candidate.status)}</small></span><span>Open →</span>
        </Link>)}
      </section>}
      {message && <p className="form-hint form-notice" data-tone={messageTone} role="status">{message}</p>}
      <div className="composer-actions"><button className="button button-primary" disabled={pending}>{pending ? "Working…" : candidates.length ? "Post as a new idea anyway" : checked ? "Submit feedback" : "Check and continue"}</button><button className="button button-quiet" type="button" disabled={pending} onClick={() => detailsRef.current?.removeAttribute("open")}>Cancel</button></div>
    </form>
  </details>;
}

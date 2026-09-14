"use client";

import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { addComment, type ActionResult } from "@/app/actions";
import type { FeedbackComment } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { rememberPendingAction } from "@/lib/pending-actions";
import type { Locale } from "@/lib/i18n";

const initialState: ActionResult = { ok: false, message: "" };

export function CommentThread({
  feedbackId,
  comments,
  readOnly,
  locale = "en",
}: {
  feedbackId: string;
  comments: FeedbackComment[];
  readOnly: boolean;
  locale?: Locale;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (_state: ActionResult, formData: FormData) => {
      const result = await addComment(formData);
      if (!result.ok && result.message.includes("Sign in")) {
        rememberPendingAction({ type: "comment", feedbackId, body: String(formData.get("body") ?? ""), returnTo: pathname });
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      }
      return result;
    },
    initialState,
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="comment-section" aria-labelledby="comments-heading">
      <h2 id="comments-heading">{locale === "ru" ? "Обсуждение" : "Conversation"}</h2>
      <div className="comment-list">
        {!comments.length && <div className="comment-empty"><strong>{locale === "ru" ? "Комментариев пока нет." : "No comments yet."}</strong><span>{locale === "ru" ? "Добавьте контекст, сценарий использования или вопрос команде." : "Add context, a use case or a question for the team."}</span></div>}
        {comments.map((comment) => (
          <article key={comment.id} className={comment.isStaff ? "comment comment-staff" : "comment"}>
            <header><strong>{comment.authorName}</strong>{comment.isStaff && <span>{locale === "ru" ? "КОМАНДА" : "TEAM"}</span>}</header>
            <p>{comment.body}</p>
            <time>{formatDate(comment.createdAt, locale)}</time>
          </article>
        ))}
      </div>
      {readOnly ? (
        <p className="form-hint">{locale === "ru" ? "Демо-обсуждение доступно только для чтения." : "This demo conversation is read-only."}</p>
      ) : (
        <form ref={formRef} action={action} className="comment-form form-stack">
          <input type="hidden" name="feedbackId" value={feedbackId} />
          <div className="form-field">
            <label htmlFor="comment-body">Add context</label>
            <textarea id="comment-body" name="body" minLength={2} maxLength={1000} placeholder="Add a use case or clarify why this matters." required />
          </div>
          {state.message && <p className="form-hint form-notice" data-tone={state.ok ? "success" : "error"} role="status">{state.message}</p>}
          <button className="button button-primary" disabled={pending}>{pending ? "Posting…" : "Post comment"}</button>
        </form>
      )}
    </section>
  );
}

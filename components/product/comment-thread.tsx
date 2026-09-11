"use client";

import { usePathname, useRouter } from "next/navigation";
import { useActionState } from "react";
import { addComment, type ActionResult } from "@/app/actions";
import type { FeedbackComment } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { rememberPendingAction } from "@/lib/pending-actions";

const initialState: ActionResult = { ok: false, message: "" };

export function CommentThread({
  feedbackId,
  comments,
  readOnly,
}: {
  feedbackId: string;
  comments: FeedbackComment[];
  readOnly: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
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

  return (
    <section className="comment-section" aria-labelledby="comments-heading">
      <h2 id="comments-heading">Conversation</h2>
      <div className="comment-list">
        {comments.map((comment) => (
          <article key={comment.id} className={comment.isStaff ? "comment comment-staff" : "comment"}>
            <header><strong>{comment.authorName}</strong>{comment.isStaff && <span>TEAM</span>}</header>
            <p>{comment.body}</p>
            <time>{formatDate(comment.createdAt)}</time>
          </article>
        ))}
      </div>
      {readOnly ? (
        <p className="form-hint">This demo conversation is read-only.</p>
      ) : (
        <form action={action} className="comment-form form-stack">
          <input type="hidden" name="feedbackId" value={feedbackId} />
          <div className="form-field">
            <label htmlFor="comment-body">Add context</label>
            <textarea id="comment-body" name="body" minLength={2} maxLength={1000} required />
          </div>
          {state.message && <p className="form-hint" role="status">{state.message}</p>}
          <button className="button button-primary" disabled={pending}>{pending ? "Posting…" : "Post comment"}</button>
        </form>
      )}
    </section>
  );
}

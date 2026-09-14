"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addComment, createFeedback, toggleVote } from "@/app/actions";
import { clearPendingAction, readPendingAction } from "@/lib/pending-actions";

export function PendingActionReplayer() {
  const pathname = usePathname();
  const router = useRouter();
  const attempted = useRef(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (attempted.current) return;
    const pending = readPendingAction();
    if (!pending || pending.returnTo !== pathname) return;
    attempted.current = true;

    void (async () => {
      let result;
      if (pending.type === "vote") result = await toggleVote(pending.feedbackId);
      else {
        const formData = new FormData();
        if (pending.type === "comment") {
          formData.set("feedbackId", pending.feedbackId);
          formData.set("body", pending.body);
          result = await addComment(formData);
        } else {
          formData.set("workspaceId", pending.workspaceId);
          formData.set("boardId", pending.boardId);
          formData.set("title", pending.title);
          formData.set("body", pending.body);
          result = await createFeedback(formData);
        }
      }
      if (result.ok) {
        clearPendingAction();
        setMessage(`${result.message} Your unfinished action was restored.`);
        if (pending.type === "feedback" && result.value) {
          router.replace(`${pending.returnTo.replace(/\/$/, "")}/post/${result.value}`);
        } else {
          router.refresh();
        }
      } else if (!result.message.toLowerCase().includes("sign in")) {
        clearPendingAction();
        setMessage(result.message);
      }
    })();
  }, [pathname, router]);

  return message ? <div className="pending-action-toast" role="status">{message}</div> : null;
}

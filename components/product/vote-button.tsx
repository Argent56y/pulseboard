"use client";

import { ArrowUp } from "lucide-react";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toggleVote } from "@/app/actions";
import { rememberPendingAction } from "@/lib/pending-actions";
import type { FeedbackPost } from "@/lib/types";

export function VoteButton({ post, readOnly }: { post: FeedbackPost; readOnly: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [votes, setVotes] = useState(post.votes);
  const [voted, setVoted] = useState(Boolean(post.votedByViewer));
  const [pending, startTransition] = useTransition();

  function vote() {
    if (readOnly) {
      router.push("/login?next=/demo");
      return;
    }
    startTransition(async () => {
      const result = await toggleVote(post.id);
      if (result.ok) {
        setVoted((current) => {
          setVotes((count) => Math.max(0, count + (current ? -1 : 1)));
          return !current;
        });
      } else if (result.message.includes("Sign in")) {
        rememberPendingAction({ type: "vote", feedbackId: post.id, returnTo: pathname });
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      }
    });
  }

  return (
    <button
      type="button"
      className="vote-button"
      onClick={vote}
      aria-label={`${voted ? "Remove vote from" : "Vote for"} ${post.title}`}
      aria-pressed={voted}
      disabled={pending}
    >
      <ArrowUp size={15} />
      <strong>{votes}</strong>
    </button>
  );
}

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
  const [savedVote, setSavedVote] = useState<{ votes: number; voted: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const votes = savedVote?.votes ?? post.votes;
  const voted = savedVote?.voted ?? Boolean(post.votedByViewer);

  function vote() {
    if (readOnly) {
      router.push("/login?next=/onboarding");
      return;
    }
    setMessage("");
    startTransition(async () => {
      const result = await toggleVote(post.id);
      if (result.ok && result.value) {
        setSavedVote(result.value);
      } else if (result.message.includes("Sign in")) {
        rememberPendingAction({ type: "vote", feedbackId: post.id, returnTo: pathname });
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="vote-control">
      <button
        type="button"
        className="vote-button"
        onClick={vote}
        aria-label={`${voted ? "Remove vote from" : "Vote for"} ${post.title}`}
        aria-pressed={voted}
        aria-busy={pending}
        disabled={pending}
      >
        <ArrowUp size={15} />
        <strong>{votes}</strong>
      </button>
      {message && <span className="vote-feedback" role="status">{message}</span>}
    </div>
  );
}

"use client";

import { ArrowUp } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleVote } from "@/app/actions";
import type { FeedbackPost } from "@/lib/types";

export function VoteButton({ post, readOnly }: { post: FeedbackPost; readOnly: boolean }) {
  const router = useRouter();
  const [votes, setVotes] = useState(post.votes);
  const [voted, setVoted] = useState(false);
  const [pending, startTransition] = useTransition();

  function vote() {
    if (readOnly) {
      router.push("/login?next=/demo");
      return;
    }
    startTransition(async () => {
      const result = await toggleVote(post.id);
      if (result.ok) {
        setVoted((current) => !current);
        setVotes((current) => current + (voted ? -1 : 1));
      } else if (result.message.includes("Sign in")) {
        router.push("/login");
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

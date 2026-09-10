import type { FeedbackStatus } from "@/lib/types";

export type WorkspaceRole = "owner" | "editor";

const transitions: Record<FeedbackStatus, FeedbackStatus[]> = {
  new: ["under_review", "closed"],
  under_review: ["new", "planned", "closed"],
  planned: ["under_review", "in_progress", "closed"],
  in_progress: ["planned", "shipped", "closed"],
  shipped: ["in_progress", "closed"],
  closed: ["new", "under_review"],
};

export function canTransitionFeedbackStatus(from: FeedbackStatus, to: FeedbackStatus) {
  return from === to || transitions[from].includes(to);
}

export function canManageMembers(role: WorkspaceRole) {
  return role === "owner";
}

export function voteIdentity(feedbackId: string, userId: string) {
  return `${feedbackId}:${userId}`;
}

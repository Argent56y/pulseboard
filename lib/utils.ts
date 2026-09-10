import type {
  FeedbackSource,
  FeedbackStatus,
  RoadmapStatus,
} from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function feedbackStatusLabel(status: FeedbackStatus) {
  return {
    new: "New",
    under_review: "Under review",
    planned: "Planned",
    in_progress: "In progress",
    shipped: "Shipped",
    closed: "Closed",
  }[status];
}

export function roadmapStatusLabel(status: RoadmapStatus) {
  return {
    planned: "Planned",
    in_progress: "In progress",
    shipped: "Shipped",
  }[status];
}

export function sourceLabel(source: FeedbackSource) {
  return {
    portal: "Portal",
    email: "Email",
    interview: "Interview",
    support: "Support",
  }[source];
}

export function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

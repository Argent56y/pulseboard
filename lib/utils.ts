import type {
  FeedbackSource,
  FeedbackStatus,
  RoadmapStatus,
} from "@/lib/types";
import { feedbackSourceLabel, localeDate, roadmapLabel, statusLabel, type Locale } from "@/lib/i18n";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value: string, locale: Locale = "en") { return localeDate(value, locale); }

export function feedbackStatusLabel(status: FeedbackStatus, locale: Locale = "en") { return statusLabel(status, locale); }

export function roadmapStatusLabel(status: RoadmapStatus, locale: Locale = "en") { return roadmapLabel(status, locale); }

export function sourceLabel(source: FeedbackSource, locale: Locale = "en") { return feedbackSourceLabel(source, locale); }

export function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { FeedbackStatus } from "@/lib/types";
import { feedbackStatusLabel } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

const statuses: Array<FeedbackStatus | "all"> = ["all", "new", "under_review", "planned", "in_progress", "shipped", "closed"];

export function PublicStatusTabs({
  root,
  active = "all",
  query = "",
  locale = "en",
}: {
  root: string;
  active?: FeedbackStatus | "all";
  query?: string;
  locale?: Locale;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <nav className="status-tabs scroll-fade-x" aria-label={locale === "ru" ? "Фильтр отзывов по статусу" : "Filter feedback by status"}>
      {statuses.map((status) => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (status !== "all") params.set("status", status);
        const selected = active === status;
        return (
          <Link
            key={status}
            href={`${root}${params.size ? `?${params.toString()}` : ""}`}
            aria-current={selected ? "page" : undefined}
            data-active={selected}
          >
            {selected && <motion.span className="status-tab-indicator" layoutId="public-status-tab" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 440, damping: 36 }} />}
            <span>{status === "all" ? (locale === "ru" ? "Все" : "All") : feedbackStatusLabel(status, locale)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type FeedbackTone = "neutral" | "success" | "warning";

export function InlineFeedback({
  message,
  tone = "neutral",
  className = "",
}: {
  message?: string;
  tone?: FeedbackTone;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertCircle : Info;

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {message ? (
        <motion.p
          key={message}
          className={`inline-feedback ${className}`.trim()}
          data-tone={tone}
          role="status"
          initial={reduceMotion ? false : { opacity: 0, y: -5, clipPath: "inset(0 0 100% 0)" }}
          animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <Icon size={14} aria-hidden="true" />
          <span>{message}</span>
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

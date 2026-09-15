"use client";

import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function CopyConfirmButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
  compact = false,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  async function copy() {
    const copyValue = value.startsWith("/") ? `${window.location.origin}${value}` : value;
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1700);
  }

  return (
    <button
      className={`copy-confirm ${className}`.trim()}
      data-copied={copied}
      type="button"
      onClick={copy}
      aria-label={copied ? copiedLabel : label}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={copied ? "copied" : "copy"}
          initial={reduceMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
          transition={{ duration: 0.14 }}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {!compact && <span>{copied ? copiedLabel : label}</span>}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

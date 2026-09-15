"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(reduceMotion ? value : 0);
  const display = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, {
      duration: 0.62,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [count, reduceMotion, value]);

  return <motion.strong className={className} aria-label={value.toLocaleString()}>{display}</motion.strong>;
}

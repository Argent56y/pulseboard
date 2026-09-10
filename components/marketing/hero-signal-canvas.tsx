"use client";

import { motion, useReducedMotion } from "motion/react";

const signals = [
  { label: "Guest roles", x: 8, y: 22, delay: 0.15 },
  { label: "Approval step", x: 19, y: 55, delay: 0.28 },
  { label: "Read-only seats", x: 34, y: 35, delay: 0.4 },
  { label: "Access expires", x: 24, y: 78, delay: 0.52 },
];

export function HeroSignalCanvas() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="hero-map"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.2 }}
      aria-label="Customer requests connecting to a product theme and roadmap item"
    >
      <svg className="hero-map-lines" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
        <path d="M95 112 C310 112 310 250 530 250" />
        <path d="M190 286 C340 286 360 250 530 250" />
        <path d="M338 182 C430 182 430 250 530 250" />
        <path d="M245 405 C390 405 405 250 530 250" />
        <path className="hero-map-line-active" d="M530 250 C680 250 690 250 825 250" />
      </svg>

      {signals.map((signal) => (
        <motion.div
          key={signal.label}
          className="hero-signal"
          style={{ left: `${signal.x}%`, top: `${signal.y}%` }}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: signal.delay }}
        >
          <span />
          {signal.label}
        </motion.div>
      ))}

      <motion.div
        className="hero-theme"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <span className="node-kicker">THEME · 7 SIGNALS</span>
        <strong>Team permissions</strong>
        <span className="node-trend">↑ 14% this month</span>
      </motion.div>

      <motion.div
        className="hero-roadmap"
        initial={reduceMotion ? false : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.95 }}
      >
        <span className="node-kicker">IN PROGRESS · SEP 2026</span>
        <strong>Controlled collaboration</strong>
        <span>Roles, approvals and expiring guest access.</span>
      </motion.div>
    </motion.div>
  );
}

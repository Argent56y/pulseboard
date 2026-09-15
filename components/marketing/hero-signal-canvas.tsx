"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Locale } from "@/lib/i18n";

const signalsEn = [
  { label: "Guest roles", x: 8, y: 22, delay: 0.15 },
  { label: "Approval step", x: 19, y: 55, delay: 0.28 },
  { label: "Read-only seats", x: 34, y: 35, delay: 0.4 },
  { label: "Access expires", x: 24, y: 78, delay: 0.52 },
];

export function HeroSignalCanvas({ locale = "en" }: { locale?: Locale }) {
  const reduceMotion = useReducedMotion();
  const signals = locale === "ru" ? [
    { label: "Гостевые роли", x: 8, y: 22, delay: 0.15 },
    { label: "Подтверждение", x: 19, y: 55, delay: 0.28 },
    { label: "Только чтение", x: 34, y: 35, delay: 0.4 },
    { label: "Срок доступа", x: 24, y: 78, delay: 0.52 },
  ] : signalsEn;

  return (
    <motion.div
      className="hero-map"
      initial={false}
      aria-label={locale === "ru" ? "Отзывы клиентов связаны с темой и решением roadmap" : "Customer requests connecting to a product theme and roadmap item"}
    >
      <svg className="hero-map-lines" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
        {["M95 112 C310 112 310 250 530 250", "M190 286 C340 286 360 250 530 250", "M338 182 C430 182 430 250 530 250", "M245 405 C390 405 405 250 530 250"].map((path, index) => <motion.path
          key={path}
          d={path}
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.65, delay: 0.28 + index * 0.1, ease: "easeOut" }}
        />)}
        <motion.path
          className="hero-map-line-active"
          d="M530 250 C680 250 690 250 825 250"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.86, ease: "easeOut" }}
        />
      </svg>

      {signals.map((signal, index) => (
        <motion.div
          key={signal.label}
          className="hero-signal"
          data-signal-index={index}
          style={{ left: `${signal.x}%`, top: `${signal.y}%` }}
          initial={reduceMotion ? false : { opacity: 1, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: signal.delay }}
        >
          <span />
          {signal.label}
        </motion.div>
      ))}

      <motion.div
        className="hero-theme"
        initial={reduceMotion ? false : { opacity: 1, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <span className="node-kicker">{locale === "ru" ? "ТЕМА · 7 СИГНАЛОВ" : "THEME · 7 SIGNALS"}</span>
        <strong>{locale === "ru" ? "Права команды" : "Team permissions"}</strong>
        <span className="node-trend">{locale === "ru" ? "↑ 14% за месяц" : "↑ 14% this month"}</span>
      </motion.div>

      <motion.div
        className="hero-roadmap"
        initial={reduceMotion ? false : { opacity: 1, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.95 }}
      >
        <span className="node-kicker">{locale === "ru" ? "В РАБОТЕ · СЕН 2026" : "IN PROGRESS · SEP 2026"}</span>
        <strong>{locale === "ru" ? "Управляемая совместная работа" : "Controlled collaboration"}</strong>
        <span>{locale === "ru" ? "Роли, подтверждения и гостевой доступ." : "Roles, approvals and expiring guest access."}</span>
      </motion.div>
    </motion.div>
  );
}

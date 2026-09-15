"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { marketingCopy, type Locale } from "@/lib/i18n";

export function WorkflowStory({ locale = "en" }: { locale?: Locale }) {
  const copy = marketingCopy[locale];
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const pathLength = useTransform(scrollYProgress, [0.14, 0.82], [0, 1]);
  const travelerY = useTransform(scrollYProgress, [0.14, 0.82], [8, 982]);
  const travelerOpacity = useTransform(scrollYProgress, [0.1, 0.16, 0.8, 0.86], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="workflow-section section-shell" aria-labelledby="workflow-title">
      <div className="section-index">{copy.workflowIndex}</div>
      <div className="workflow-layout">
        <div className="workflow-intro">
          <p className="eyebrow">{copy.workflowEyebrow}</p>
          <h2 id="workflow-title">{copy.workflowTitle}</h2>
        </div>
        <div className="workflow-steps">
          <motion.svg className="workflow-trace" viewBox="0 0 80 1000" preserveAspectRatio="none" aria-hidden="true">
            <path className="workflow-trace-rail" d="M24 0 C66 150 9 260 42 392 S12 628 44 760 S14 914 34 1000" />
            <motion.path
              className="workflow-trace-active"
              d="M24 0 C66 150 9 260 42 392 S12 628 44 760 S14 914 34 1000"
              style={{ pathLength: reduceMotion ? 1 : pathLength }}
            />
            {!reduceMotion && <motion.circle className="workflow-traveler" cx="34" cy="0" r="5" style={{ y: travelerY, opacity: travelerOpacity }} />}
          </motion.svg>
          {copy.steps.map((step, index) => (
            <motion.article
              key={step[0]}
              className="workflow-step"
              initial={{ opacity: 0.35 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.6 }}
            >
              <span><i aria-hidden="true" />{String(index + 1).padStart(2, "0")}</span>
              <h3>{step[0]}</h3>
              <p>{step[1]}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

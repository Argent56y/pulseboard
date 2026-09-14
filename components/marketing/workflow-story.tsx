"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { marketingCopy, type Locale } from "@/lib/i18n";

export function WorkflowStory({ locale = "en" }: { locale?: Locale }) {
  const copy = marketingCopy[locale];
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineScale = useTransform(scrollYProgress, [0.15, 0.78], [0, 1]);

  return (
    <section ref={ref} className="workflow-section section-shell" aria-labelledby="workflow-title">
      <div className="section-index">{copy.workflowIndex}</div>
      <div className="workflow-layout">
        <div className="workflow-intro">
          <p className="eyebrow">{copy.workflowEyebrow}</p>
          <h2 id="workflow-title">{copy.workflowTitle}</h2>
        </div>
        <div className="workflow-steps">
          <motion.div className="workflow-progress" style={{ scaleY: lineScale }} />
          {copy.steps.map((step, index) => (
            <motion.article
              key={step[0]}
              className="workflow-step"
              initial={{ opacity: 0.35 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.6 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step[0]}</h3>
              <p>{step[1]}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

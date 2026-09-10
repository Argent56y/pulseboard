"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const steps = [
  {
    number: "01",
    title: "Capture the language",
    body: "Collect requests from your public portal, interviews, support and email without stripping away context.",
  },
  {
    number: "02",
    title: "Find the pattern",
    body: "Semantic suggestions surface related signals. Your team confirms what belongs together.",
  },
  {
    number: "03",
    title: "Show the decision",
    body: "Connect a theme to roadmap work, publish the status and keep the original evidence one click away.",
  },
];

export function WorkflowStory() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineScale = useTransform(scrollYProgress, [0.15, 0.78], [0, 1]);

  return (
    <section ref={ref} className="workflow-section section-shell" aria-labelledby="workflow-title">
      <div className="section-index">02 / WORKFLOW</div>
      <div className="workflow-layout">
        <div className="workflow-intro">
          <p className="eyebrow">From request to release</p>
          <h2 id="workflow-title">A calm path through noisy feedback.</h2>
        </div>
        <div className="workflow-steps">
          <motion.div className="workflow-progress" style={{ scaleY: lineScale }} />
          {steps.map((step) => (
            <motion.article
              key={step.number}
              className="workflow-step"
              initial={{ opacity: 0.35 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.6 }}
            >
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

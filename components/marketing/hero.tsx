"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { HeroSignalCanvas } from "@/components/marketing/hero-signal-canvas";

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <header className="marketing-nav">
        <Link href="/" className="wordmark" aria-label="Pulseboard home">
          <span className="wordmark-dot" />
          Pulseboard
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/demo">Public board</Link>
          <Link href="/demo/app/map">Live demo</Link>
          <Link href="/login" className="nav-action">
            Sign in <ArrowUpRight size={14} />
          </Link>
        </nav>
      </header>

      <motion.div
        className="hero-copy"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">Feedback intelligence for small product teams</p>
        <h1 id="hero-title">Pulseboard.</h1>
        <p className="hero-promise">
          Turn scattered customer requests into a roadmap you can explain.
        </p>
        <div className="hero-actions">
          <Link href="/demo/app/map" className="button button-primary">
            Explore the live demo <ArrowUpRight size={16} />
          </Link>
          <Link href="/login" className="button button-quiet">
            Create a workspace
          </Link>
        </div>
      </motion.div>

      <HeroSignalCanvas />
      <div className="hero-caption" aria-hidden="true">
        <span>RAW SIGNALS</span>
        <span>THEME 04</span>
        <span>ROADMAP / Q4</span>
      </div>
    </section>
  );
}

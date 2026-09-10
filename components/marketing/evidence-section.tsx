import { ArrowRight, Quote } from "lucide-react";
import Link from "next/link";

export function EvidenceSection() {
  return (
    <section className="evidence-section section-shell" aria-labelledby="evidence-title">
      <div className="section-index">01 / EVIDENCE</div>
      <div className="evidence-heading">
        <p className="eyebrow">Every decision keeps its evidence</p>
        <h2 id="evidence-title">Know what to build — and why.</h2>
        <p>
          Pulseboard keeps the customer language, emerging theme and roadmap decision in one inspectable path.
        </p>
      </div>

      <div className="evidence-line" aria-label="Evidence path example">
        <article className="evidence-quote">
          <Quote size={20} />
          <blockquote>
            “We need collaborators who can comment without seeing billing or workspace settings.”
          </blockquote>
          <footer>Elliot · Email interview</footer>
        </article>
        <ArrowRight className="evidence-arrow" aria-hidden="true" />
        <div className="evidence-theme">
          <span>THEME · 7 SIGNALS</span>
          <strong>Team permissions</strong>
          <small>Confidence 94%</small>
        </div>
        <ArrowRight className="evidence-arrow" aria-hidden="true" />
        <div className="evidence-decision">
          <span>IN PROGRESS</span>
          <strong>Controlled collaboration</strong>
          <small>Target · September</small>
        </div>
      </div>

      <Link href="/demo/app/map" className="text-link">
        Inspect the complete evidence path <ArrowRight size={15} />
      </Link>
    </section>
  );
}

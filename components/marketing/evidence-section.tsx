import { ArrowRight, Quote } from "lucide-react";
import Link from "next/link";
import { localizedPath, marketingCopy, type Locale } from "@/lib/i18n";

export function EvidenceSection({ locale = "en" }: { locale?: Locale }) {
  const copy = marketingCopy[locale];
  return (
    <section className="evidence-section section-shell" aria-labelledby="evidence-title">
      <div className="section-index">{copy.evidenceIndex}</div>
      <div className="evidence-heading">
        <p className="eyebrow">{copy.evidenceEyebrow}</p>
        <h2 id="evidence-title">{copy.evidenceTitle}</h2>
        <p>{copy.evidenceBody}</p>
      </div>

      <div className="evidence-line" aria-label="Evidence path example">
        <article className="evidence-quote">
          <Quote size={20} />
          <blockquote>
            “{copy.quote}”
          </blockquote>
          <footer>{copy.quoteBy}</footer>
        </article>
        <ArrowRight className="evidence-arrow" aria-hidden="true" />
        <div className="evidence-theme">
          <span>{copy.themeMeta}</span>
          <strong>{copy.theme}</strong>
          <small>{copy.confidence}</small>
        </div>
        <ArrowRight className="evidence-arrow" aria-hidden="true" />
        <div className="evidence-decision">
          <span>{copy.decisionState}</span>
          <strong>{copy.decision}</strong>
          <small>{copy.decisionTarget}</small>
        </div>
      </div>

      <Link href={localizedPath(locale, "/demo/app/map")} className="text-link">
        {copy.inspect} <ArrowRight size={15} />
      </Link>
    </section>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function FinalCta() {
  return (
    <footer className="final-cta">
      <div className="final-cta-copy">
        <p className="eyebrow">The next decision starts here</p>
        <h2>Find the signal in your feedback.</h2>
        <div className="hero-actions">
          <Link href="/demo/app/map" className="button button-primary">
            Explore demo <ArrowUpRight size={16} />
          </Link>
          <Link href="/login" className="button button-quiet">Create workspace</Link>
        </div>
      </div>
      <div className="site-footer">
        <Link href="/" className="wordmark"><span className="wordmark-dot" />Pulseboard</Link>
        <p>Concept product designed and built by Seva Dev-a.</p>
        <span>© 2026</span>
      </div>
    </footer>
  );
}

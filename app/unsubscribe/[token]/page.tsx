import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabaseUrl } from "@/lib/supabase/config";

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let success = false;
  if (supabaseUrl && token) {
    const response = await fetch(`${supabaseUrl}/functions/v1/unsubscribe-feedback?token=${encodeURIComponent(token)}`, { method: "GET", cache: "no-store" }).catch(() => null);
    success = Boolean(response?.ok);
  }
  return <main className="legal-page"><Link className="wordmark" href="/"><span className="wordmark-dot" />Pulseboard</Link><section className="unsubscribe-panel">{success ? <CheckCircle2 size={28} /> : <XCircle size={28} />}<span className="app-kicker">Email preferences</span><h1>{success ? "You’re unsubscribed." : "This link is no longer valid."}</h1><p>{success ? "We won’t send more updates for this feedback item. Other subscriptions are unchanged." : "The link may have already been used. You can manage a subscription from its feedback page after signing in."}</p><Link className="button button-outline" href="/">Return to Pulseboard</Link></section></main>;
}

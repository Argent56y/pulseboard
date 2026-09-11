import Link from "next/link";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { requireViewer } from "@/lib/auth";

export default async function OnboardingPage() {
  await requireViewer("/onboarding");
  return <main className="onboarding-page">
    <Link className="wordmark" href="/"><span className="wordmark-dot" />Pulseboard</Link>
    <section>
      <span className="app-kicker">Your first workspace</span>
      <h1>Give customer signals a home.</h1>
      <p>Choose a clear name and URL. You can change the board copy and invite editors later.</p>
      <OnboardingForm />
      <Link className="demo-text-link" href="/demo/app/map">Explore the sample workspace first →</Link>
    </section>
  </main>;
}

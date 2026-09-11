import Link from "next/link";
import { redirect } from "next/navigation";
import { GitFork } from "lucide-react";
import { loginWithGithub } from "@/app/login/actions";
import { EmailOtpForm } from "@/components/auth/email-otp-form";
import { getViewer } from "@/lib/auth";

const errors: Record<string, string> = { "not-configured": "Authentication is temporarily unavailable.", oauth: "GitHub sign-in could not be started.", callback: "The sign-in session could not be completed." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  const nextPath = query.next?.startsWith("/") && !query.next.startsWith("//") ? query.next : "/app";
  if (await getViewer()) redirect(nextPath);
  return <main className="auth-page"><section className="auth-visual"><Link className="wordmark" href="/"><span className="wordmark-dot" />Pulseboard</Link><div><span className="eyebrow">Turn feedback into evidence</span><h1>Find the signal your roadmap needs.</h1><p>A calm place to collect requests, explain decisions and close the loop.</p></div><span className="app-kicker">Built by Seva Dev-a</span></section><section className="auth-panel"><div className="auth-form"><span className="app-kicker">Welcome</span><h2>Continue to Pulseboard</h2><p>Customers use a six-digit email code. Founders can also continue with GitHub.</p>{query.error && <div className="auth-message" role="alert">{errors[query.error] ?? query.error}</div>}<form action={loginWithGithub}><input type="hidden" name="next" value={nextPath} /><button className="button button-primary auth-button" type="submit"><GitFork size={16} /> Continue with GitHub</button></form><div className="auth-divider">or use email OTP</div><EmailOtpForm nextPath={nextPath} /><p className="auth-terms">No password. The code and any unfinished action stay in this browser tab only.</p></div></section></main>;
}

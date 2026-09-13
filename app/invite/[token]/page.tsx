import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { acceptInvite } from "@/app/actions";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; async function join() { "use server"; const result = await acceptInvite(token); if (result.ok) redirect(result.value ?? "/app"); redirect(`/login?error=${encodeURIComponent(result.message)}`); } return <main className="onboarding-page"><Link className="wordmark" href="/"><span className="wordmark-dot" />Pulseboard</Link><section className="invite-panel"><Users size={26} /><span className="app-kicker">Workspace invitation</span><h1>Build the roadmap together.</h1><p>You have been invited to help triage feedback, confirm themes and keep customers in the loop.</p><form action={join}><button className="button button-primary" type="submit">Accept invitation</button></form></section></main>; }

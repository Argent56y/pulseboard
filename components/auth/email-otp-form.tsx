"use client";

import { Mail, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function EmailOtpForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [retryIn, setRetryIn] = useState(0);

  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = window.setInterval(() => setRetryIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [retryIn]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setStep("code");
      setRetryIn(45);
      setMessage("We sent a six-digit code. It expires shortly.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send the code. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setMessage("Enter the complete six-digit code.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "email" });
      if (error) throw error;
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That code could not be verified.");
      setPending(false);
    }
  }

  if (step === "code") {
    return <form onSubmit={verifyCode} className="form-stack otp-form">
      <div className="otp-sent-to"><span>Code sent to</span><strong>{email}</strong><button type="button" onClick={() => { setStep("email"); setCode(""); setMessage(""); }}>Change</button></div>
      <div className="form-field">
        <label htmlFor="otp-code">Six-digit code</label>
        <input id="otp-code" className="otp-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required autoFocus aria-describedby="otp-message" />
      </div>
      {message && <p id="otp-message" className="form-hint" role="status">{message}</p>}
      <button className="button button-primary" type="submit" disabled={pending || code.length !== 6}>{pending ? "Verifying…" : "Verify and continue"}</button>
      <button className="otp-resend" type="button" disabled={pending || retryIn > 0} onClick={() => sendCode()}><RotateCcw size={13} /> {retryIn > 0 ? `Resend in ${retryIn}s` : "Send a new code"}</button>
    </form>;
  }

  return <form onSubmit={sendCode} className="form-stack otp-form">
    <div className="form-field">
      <label htmlFor="email">Email address</label>
      <div className="input-with-icon"><Mail size={15} /><input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" placeholder="you@company.com" /></div>
    </div>
    {message && <p className="form-hint" role="alert">{message}</p>}
    <button className="button button-outline" type="submit" disabled={pending}>{pending ? "Sending…" : "Email me a code"}</button>
  </form>;
}

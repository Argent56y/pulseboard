"use client";

import { Mail, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";

export function EmailOtpForm({ nextPath, locale = "en" }: { nextPath: string; locale?: Locale }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [retryIn, setRetryIn] = useState(0);
  const copy = locale === "ru" ? {
    sentTo: "Код отправлен на", change: "Изменить", code: "Код из письма", sent: "Мы отправили код. Он действует ограниченное время.", invalid: "Введите код полностью.", verify: "Проверяем…", continue: "Проверить и продолжить", resend: "Отправить новый код", resendIn: "Повтор через", email: "Email", sending: "Отправляем…", send: "Получить код на email", sendError: "Не удалось отправить код. Попробуйте ещё раз.", verifyError: "Не удалось проверить этот код.",
  } : {
    sentTo: "Code sent to", change: "Change", code: "Email code", sent: "We sent a code. It expires shortly.", invalid: "Enter the complete code.", verify: "Verifying…", continue: "Verify and continue", resend: "Send a new code", resendIn: "Resend in", email: "Email address", sending: "Sending…", send: "Email me a code", sendError: "Could not send the code. Try again.", verifyError: "That code could not be verified.",
  };

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
      setMessage(copy.sent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.sendError);
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6,8}$/.test(code)) {
      setMessage(copy.invalid);
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
      setMessage(error instanceof Error ? error.message : copy.verifyError);
      setPending(false);
    }
  }

  if (step === "code") {
    return <form onSubmit={verifyCode} className="form-stack otp-form">
      <div className="otp-sent-to"><span>{copy.sentTo}</span><strong>{email}</strong><button type="button" onClick={() => { setStep("email"); setCode(""); setMessage(""); }}>{copy.change}</button></div>
      <div className="form-field">
        <label htmlFor="otp-code">{copy.code}</label>
        <input id="otp-code" className="otp-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength={6} maxLength={8} required autoFocus aria-describedby="otp-message" />
      </div>
      {message && <p id="otp-message" className="form-hint" role="status">{message}</p>}
      <button className="button button-primary" type="submit" disabled={pending || code.length < 6}>{pending ? copy.verify : copy.continue}</button>
      <button className="otp-resend" type="button" disabled={pending || retryIn > 0} onClick={() => sendCode()}><RotateCcw size={13} /> {retryIn > 0 ? `${copy.resendIn} ${retryIn}s` : copy.resend}</button>
    </form>;
  }

  return <form onSubmit={sendCode} className="form-stack otp-form">
    <div className="form-field">
      <label htmlFor="email">{copy.email}</label>
      <div className="input-with-icon"><Mail size={15} /><input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" placeholder="you@company.com" /></div>
    </div>
    {message && <p className="form-hint" role="alert">{message}</p>}
    <button className="button button-outline" type="submit" disabled={pending}>{pending ? copy.sending : copy.send}</button>
  </form>;
}

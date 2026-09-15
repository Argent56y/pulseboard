import Link from "next/link";
import { redirect } from "next/navigation";
import { GitFork } from "lucide-react";
import { loginWithGithub } from "@/app/login/actions";
import { EmailOtpForm } from "@/components/auth/email-otp-form";
import { getViewer } from "@/lib/auth";

const errors = {
  en: { "not-configured": "Authentication is temporarily unavailable.", oauth: "GitHub sign-in could not be started.", callback: "The sign-in session could not be completed." },
  ru: { "not-configured": "Авторизация временно недоступна.", oauth: "Не удалось начать вход через GitHub.", callback: "Не удалось завершить вход." },
} as const;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; locale?: string }> }) {
  const query = await searchParams;
  const nextPath = query.next?.startsWith("/") && !query.next.startsWith("//") ? query.next : "/app";
  const locale = query.locale === "ru" ? "ru" : "en";
  const copy = locale === "ru" ? {
    home: "Главная Pulseboard", eyebrow: "Отзывы становятся доказательствами", title: "Найдите сигнал для следующего решения.", body: "Собирайте запросы, объясняйте приоритеты и возвращайтесь к клиентам с результатом.", welcome: "Добро пожаловать", continue: "Войти в Pulseboard", description: "Клиенты входят по коду из письма. Основатели также могут использовать GitHub.", github: "Продолжить через GitHub", divider: "или войдите по email", terms: "Без пароля. Код и незавершённое действие сохраняются только в этой вкладке.",
  } : {
    home: "Pulseboard home", eyebrow: "Turn feedback into evidence", title: "Find the signal your roadmap needs.", body: "A calm place to collect requests, explain decisions and close the loop.", welcome: "Welcome", continue: "Continue to Pulseboard", description: "Customers use an email code. Founders can also continue with GitHub.", github: "Continue with GitHub", divider: "or use email OTP", terms: "No password. The code and any unfinished action stay in this browser tab only.",
  };
  if (await getViewer()) redirect(nextPath);
  const errorMessage = query.error ? errors[locale][query.error as keyof typeof errors.en] ?? query.error : "";
  return <main className="auth-page" lang={locale}><section className="auth-visual"><Link className="wordmark" href={locale === "ru" ? "/ru" : "/"} aria-label={copy.home}><span className="wordmark-dot" />Pulseboard</Link><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.body}</p></div><span className="app-kicker">Built by Seva Dev-a</span></section><section className="auth-panel"><div className="auth-form"><span className="app-kicker">{copy.welcome}</span><h2>{copy.continue}</h2><p>{copy.description}</p>{errorMessage && <div className="auth-message" role="alert">{errorMessage}</div>}<form action={loginWithGithub}><input type="hidden" name="next" value={nextPath} /><input type="hidden" name="locale" value={locale} /><button className="button button-primary auth-button" type="submit"><GitFork size={17} /> {copy.github}</button></form><div className="auth-divider">{copy.divider}</div><EmailOtpForm nextPath={nextPath} locale={locale} /><p className="auth-terms">{copy.terms}</p></div></section></main>;
}

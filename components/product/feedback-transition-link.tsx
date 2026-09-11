"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, type ReactNode } from "react";

export function FeedbackTransitionLink({ href, children, className }: LinkProps & { children: ReactNode; className?: string }) {
  const router = useRouter();
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || !document.startViewTransition) return;
    event.preventDefault();
    document.startViewTransition(() => router.push(String(href)));
  }
  return <Link href={href} className={className} onClick={navigate}>{children}</Link>;
}

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://pulseboard.sevadeva.tech"),
  title: {
    default: "Pulseboard — Feedback you can explain",
    template: "%s · Pulseboard",
  },
  description:
    "Turn scattered customer requests into a roadmap your team can explain. A concept product designed and built by Seva Dev-a.",
  openGraph: {
    title: "Pulseboard — Feedback you can explain",
    description: "See the evidence behind every product decision.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "/",
    languages: { "en-US": "/", "ru-RU": "/ru" },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pulseboard — отзывы, темы и решения в одной карте",
  description: "Pulseboard помогает небольшим продуктовым командам превращать разрозненные отзывы клиентов в понятные темы, roadmap и публичные обновления.",
  alternates: {
    canonical: "/ru",
    languages: { "en-US": "/", "ru-RU": "/ru" },
  },
  openGraph: {
    title: "Pulseboard — от отзывов к понятному roadmap",
    description: "Изучите работающий solo-MVP и Signal Map — карту связей между отзывами, темами и решениями.",
    url: "/ru",
    locale: "ru_RU",
    alternateLocale: ["en_US"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulseboard — от отзывов к понятному roadmap",
    description: "Работающий solo-MVP с публичной доской и Signal Map.",
  },
};

export default function RussianLayout({ children }: { children: React.ReactNode }) {
  return <div lang="ru" className="locale-ru">{children}</div>;
}

import type { FeedbackSource, FeedbackStatus, RoadmapStatus } from "@/lib/types";

export type Locale = "en" | "ru";

export function localizedPath(locale: Locale, path: string) {
  if (locale === "en") return path;
  if (path === "/") return "/ru";
  if (path.startsWith("/demo")) return `/ru${path}`;
  return path;
}

export const localeLabel: Record<Locale, string> = { en: "EN", ru: "RU" };

export function statusLabel(status: FeedbackStatus, locale: Locale = "en") {
  const labels: Record<Locale, Record<FeedbackStatus, string>> = {
    en: { new: "New", under_review: "Under review", planned: "Planned", in_progress: "In progress", shipped: "Shipped", closed: "Closed" },
    ru: { new: "Новая", under_review: "На рассмотрении", planned: "Запланировано", in_progress: "В работе", shipped: "Выпущено", closed: "Закрыто" },
  };
  return labels[locale][status];
}

export function roadmapLabel(status: RoadmapStatus, locale: Locale = "en") {
  const labels: Record<Locale, Record<RoadmapStatus, string>> = {
    en: { planned: "Planned", in_progress: "In progress", shipped: "Shipped" },
    ru: { planned: "Запланировано", in_progress: "В работе", shipped: "Выпущено" },
  };
  return labels[locale][status];
}

export function feedbackSourceLabel(source: FeedbackSource, locale: Locale = "en") {
  const labels: Record<Locale, Record<FeedbackSource, string>> = {
    en: { portal: "Portal", email: "Email", interview: "Interview", support: "Support", manual: "Manual", csv: "CSV import" },
    ru: { portal: "Портал", email: "Почта", interview: "Интервью", support: "Поддержка", manual: "Вручную", csv: "Импорт CSV" },
  };
  return labels[locale][source];
}

export function localeDate(value: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export const marketingCopy = {
  en: {
    navBoard: "Public board", navDemo: "Live demo", navSignIn: "Sign in",
    eyebrow: "Feedback intelligence for small product teams",
    promise: "Turn scattered customer requests into a roadmap you can explain.",
    primary: "Explore the live demo", secondary: "Create a workspace",
    captions: ["RAW SIGNALS", "THEME 04", "ROADMAP / Q4"],
    evidenceIndex: "01 / EVIDENCE", evidenceEyebrow: "Every decision keeps its evidence",
    evidenceTitle: "Know what to build — and why.",
    evidenceBody: "Pulseboard keeps the customer language, emerging theme and roadmap decision in one inspectable path.",
    quote: "We need collaborators who can comment without seeing billing or workspace settings.",
    quoteBy: "Elliot · Email interview", theme: "Team permissions", themeMeta: "THEME · 7 SIGNALS", confidence: "Confidence 94%",
    decision: "Controlled collaboration", decisionState: "IN PROGRESS", decisionTarget: "Target · September",
    inspect: "Inspect the complete evidence path",
    workflowIndex: "02 / WORKFLOW", workflowEyebrow: "From request to release", workflowTitle: "A calm path through noisy feedback.",
    steps: [
      ["Capture the language", "Collect requests from your public portal, interviews, support and email without stripping away context."],
      ["Find the pattern", "Semantic suggestions surface related signals. Your team confirms what belongs together."],
      ["Show the decision", "Connect a theme to roadmap work, publish the status and keep the original evidence one click away."],
    ],
    boardIndex: "03 / PUBLIC BOARD", boardEyebrow: "Close the loop in public", boardTitle: "A feedback board people want to return to.", boardButton: "Open Northstar’s board",
    finalEyebrow: "The next decision starts here", finalTitle: "Find the signal in your feedback.", finalPrimary: "Explore demo", finalSecondary: "Create workspace",
    footer: "Concept product designed and built by Seva Dev-a.",
  },
  ru: {
    navBoard: "Доска отзывов", navDemo: "Демо", navSignIn: "Войти",
    eyebrow: "Система работы с отзывами для небольших продуктовых команд",
    promise: "Превращайте разрозненные отзывы клиентов в roadmap, который легко объяснить.",
    primary: "Открыть Signal Map", secondary: "Посмотреть доску",
    captions: ["СЫРЫЕ СИГНАЛЫ", "ТЕМА 04", "ROADMAP / Q4"],
    evidenceIndex: "01 / ДОКАЗАТЕЛЬСТВА", evidenceEyebrow: "У каждого решения остаётся контекст",
    evidenceTitle: "Понятно, что строить и почему.",
    evidenceBody: "Pulseboard сохраняет слова клиента, найденную тему и принятое решение в одной проверяемой цепочке.",
    quote: "Нам нужны участники, которые могут комментировать, но не видят оплату и настройки workspace.",
    quoteBy: "Эллиот · Интервью по почте", theme: "Права команды", themeMeta: "ТЕМА · 7 СИГНАЛОВ", confidence: "Совпадение 94%",
    decision: "Управляемая совместная работа", decisionState: "В РАБОТЕ", decisionTarget: "Цель · сентябрь",
    inspect: "Открыть полную цепочку доказательств",
    workflowIndex: "02 / ПРОЦЕСС", workflowEyebrow: "От запроса до релиза", workflowTitle: "Спокойный путь через шум отзывов.",
    steps: [
      ["Сохранить слова клиента", "Соберите запросы из публичной доски, интервью, поддержки и почты, не теряя контекст."],
      ["Найти закономерность", "AI предлагает связанные сигналы. Команда решает, какие отзывы действительно относятся к одной теме."],
      ["Показать решение", "Свяжите тему с roadmap, опубликуйте статус и оставьте исходные отзывы доступными в один клик."],
    ],
    boardIndex: "03 / ПУБЛИЧНАЯ ДОСКА", boardEyebrow: "Замкните цикл обратной связи", boardTitle: "Доска отзывов, к которой хочется возвращаться.", boardButton: "Открыть доску Northstar",
    finalEyebrow: "Следующее решение начинается здесь", finalTitle: "Найдите сигнал в отзывах.", finalPrimary: "Открыть Signal Map", finalSecondary: "Посмотреть доску",
    footer: "Концепт продукта спроектирован и разработан Арсением Козелом · Seva Dev-a.",
  },
} as const;

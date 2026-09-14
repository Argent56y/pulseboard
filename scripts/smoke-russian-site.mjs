import { chromium } from "playwright";

const origin = process.env.PULSEBOARD_ORIGIN ?? "http://127.0.0.1:3000";
const routes = [
  "/ru",
  "/ru/demo",
  "/ru/demo/post/feedback-01",
  "/ru/demo/roadmap",
  "/ru/demo/changelog",
  "/ru/demo/app/map",
  "/ru/demo/app/inbox",
];
const viewports = [[390, 844], [768, 1024], [1440, 900]];

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const results = [];

for (const route of routes) {
  for (const [width, height] of viewports) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      lang: document.querySelector("[lang='ru']")?.getAttribute("lang") ?? null,
      title: document.title,
    }));
    results.push({ route, viewport: `${width}x${height}`, status: response?.status(), ...metrics });
    await page.close();
  }
}

const switchPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await switchPage.goto(`${origin}/ru/demo/roadmap`, { waitUntil: "networkidle" });
const languageLinks = await switchPage.locator(".locale-switch a").evaluateAll((links) =>
  links.map((link) => ({ label: link.textContent?.trim(), href: link.getAttribute("href") })),
);
await switchPage.close();
await browser.close();

const failures = results.filter((result) => result.status !== 200 || result.overflow !== 0 || result.lang !== "ru");
if (JSON.stringify(languageLinks) !== JSON.stringify([
  { label: "RU", href: "/ru/demo/roadmap" },
  { label: "EN", href: "/demo/roadmap" },
])) {
  failures.push({ route: "/ru/demo/roadmap", languageLinks });
}

console.log(JSON.stringify({ results, languageLinks, failures }, null, 2));
if (failures.length) process.exitCode = 1;

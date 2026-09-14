import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const origin = process.env.PULSEBOARD_CAPTURE_ORIGIN ?? "http://127.0.0.1:3000";
const output = path.resolve("tmp/atom/screenshots");
await fs.mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const results = [];
for (const [width, height] of [[390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(`${origin}/ru`, { waitUntil: "networkidle" });
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    clippedText: [...document.querySelectorAll("h1,h2,h3,.hero-roadmap strong")].filter((node) => node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1).map((node) => node.textContent?.trim()),
  }));
  results.push({ viewport: `${width}x${height}`, ...metrics });
  if (width === 1440) await page.screenshot({ path: path.join(output, "ru-landing.png"), fullPage: true });
  await page.close();
}

for (const [name, route] of [["ru-public-board", "/ru/demo"], ["ru-signal-map", "/ru/demo/app/map"], ["ru-inbox", "/ru/demo/app/inbox"]]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: false });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  results.push({ route, viewport: "1440x900", overflow });
  await page.close();
}
const detailPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await detailPage.goto(`${origin}/ru/demo/app/map`, { waitUntil: "networkidle" });
await detailPage.getByText("Права команды", { exact: true }).first().click();
await detailPage.waitForTimeout(350);
await detailPage.screenshot({ path: path.join(output, "ru-signal-map-theme.png"), fullPage: false });
await detailPage.close();
await browser.close();
console.log(JSON.stringify(results, null, 2));

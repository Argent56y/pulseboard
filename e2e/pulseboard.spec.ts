import { expect, test } from "@playwright/test";

test("landing explains the product and opens the live demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pulseboard" })).toBeVisible();
  await expect(page.getByText("Turn scattered customer requests into a roadmap you can explain." )).toBeVisible();
  await page.getByRole("link", { name: /explore the live demo/i }).first().click();
  await expect(page).toHaveURL(/\/demo\/app\/map$/);
  await expect(page.getByRole("heading", { name: "Signal Map" })).toBeVisible();
});

test("public feedback is searchable and has a detail conversation", async ({ page }) => {
  await page.goto("/demo");
  await page.getByPlaceholder("Search feedback").fill("guided setup");
  await expect(page.getByRole("heading", { name: "A guided setup for first-time teams" })).toBeVisible();
  await page.getByRole("heading", { name: "A guided setup for first-time teams" }).click();
  await expect(page.getByRole("heading", { name: "Conversation" })).toBeVisible();
  await expect(page.getByText("This demo conversation is read-only.")).toBeVisible();
});

test("founder demo renders an inspectable signal map", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop canvas is replaced by a linear evidence view");
  await page.goto("/demo/app/map");
  await expect(page.getByRole("heading", { name: "Signal Map" })).toBeVisible();
  await expect(page.getByText("Evidence network")).toBeVisible();
  await expect(page.locator(".react-flow")).toBeVisible();
  await expect(page.locator(".signal-node-roadmap")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "Controlled collaboration" })).toBeVisible();
});

test("founder demo navigation keeps the workspace shell in place", async ({ page, isMobile }) => {
  await page.goto("/demo/app/map");

  const shell = page.locator(".app-shell");
  await expect(shell).toHaveAttribute("data-navigation-ready", "true");
  if (!isMobile) {
    await shell.evaluate((element) => Reflect.set(element, "__workspaceShellIdentity", "persistent"));
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(shell).toHaveAttribute("data-collapsed", "true");
  }

  await page.getByRole("link", { name: "Inbox" }).click();
  await expect(page).toHaveURL(/\/demo\/app\/inbox$/);
  await expect(page.getByRole("heading", { name: "Feedback inbox" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customer signals" })).toBeVisible();
  if (!isMobile) {
    expect(await shell.evaluate((element) => Reflect.get(element, "__workspaceShellIdentity"))).toBe("persistent");
    await expect(shell).toHaveAttribute("data-collapsed", "true");
  }

  await page.getByRole("link", { name: "Roadmap" }).click();
  await expect(page).toHaveURL(/\/demo\/app\/roadmap$/);
  await expect(page.getByRole("heading", { name: "Product direction" })).toBeVisible();

  await page.getByRole("link", { name: "Changelog" }).click();
  await expect(page).toHaveURL(/\/demo\/app\/changelog$/);
  await expect(page.getByRole("heading", { name: "Release communication" })).toBeVisible();
  await expect(page.getByText("Publishing is disabled in the demo.")).toBeVisible();
  await expect(page.getByRole("button", { name: /edit|unpublish/i })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("public board status filters change the visible feedback", async ({ page }) => {
  await page.goto("/ru/demo");
  await page.getByRole("link", { name: "Запланировано", exact: true }).click();
  await expect(page).toHaveURL(/status=planned/);

  const rows = page.locator(".feedback-row");
  await expect(rows).not.toHaveCount(0);
  const labels = await rows.locator(".status").allTextContents();
  expect(labels.every((label) => label.trim() === "Запланировано")).toBe(true);
});

test("russian founder demo has the same workflow and working filters", async ({ page }) => {
  await page.goto("/ru/demo/app/inbox");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-navigation-ready", "true");
  await expect(page.getByRole("link", { name: "Входящие" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Signal Map" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Roadmap" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Обновления" })).toBeVisible();
  await expect(page.locator(".header-search kbd")).toHaveCount(0);

  await page.getByLabel("Фильтр по статусу").selectOption("planned");
  await expect(page.locator(".table-count")).toContainText("9 / 36");
  const statusSelects = page.locator("tbody .status-select");
  await expect(statusSelects).not.toHaveCount(0);
  const values = await statusSelects.evaluateAll((selects) => selects.map((select) => (select as HTMLSelectElement).value));
  expect(values.every((value) => value === "planned")).toBe(true);

  await page.getByRole("link", { name: "Обновления" }).click();
  await expect(page.getByRole("heading", { name: "Обновления продукта" })).toBeVisible();
  await expect(page.getByText("В демо публикация отключена.")).toBeVisible();
});

test("russian login exposes both GitHub and email OTP", async ({ page }) => {
  await page.goto("/login?locale=ru");
  await expect(page.getByRole("button", { name: "Продолжить через GitHub" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Получить код" })).toBeVisible();
});

test("mobile founder demo exposes the linear evidence fallback", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only acceptance check");
  await page.goto("/demo/app/map");
  await expect(page.locator(".mobile-signal-list")).toBeVisible();
  await expect(page.getByText("feedback → theme → roadmap").first()).toBeVisible();
});

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

test("mobile founder demo exposes the linear evidence fallback", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only acceptance check");
  await page.goto("/demo/app/map");
  await expect(page.locator(".mobile-signal-list")).toBeVisible();
  await expect(page.getByText("feedback → theme → roadmap").first()).toBeVisible();
});

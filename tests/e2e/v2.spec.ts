import { test, expect } from "@playwright/test";

test.describe("v2 — hero + chat", () => {
  test("hero block renders with recovery ring + uppercase recommendation", async ({ page }) => {
    await page.goto("/");
    // Hero section with recommendation text
    const heroSection = page.locator("section").first();
    // Hero recommendation uppercase (DELOAD, DEFICIT, MAINTENANCE, etc.)
    const heroRec = heroSection.getByRole("heading", { name: /DELOAD|DEFICIT|MAINTENANCE|MAXIMIZE/ });
    await expect(heroRec).toBeVisible();
    // Recovery label inside the recovery ring (in a div within the hero section)
    const recoveryLabel = heroSection.locator("div").filter({ hasText: "RECOVERY" }).first();
    await expect(recoveryLabel).toBeVisible();
  });

  test("chat drawer is visible and has an input box", async ({ page }) => {
    await page.goto("/");
    // The drawer might be open or collapsed; try to find input or the rail text
    const input = page.getByPlaceholder(/Ask Claude/i);
    const rail = page.getByText("ASK CLAUDE");
    // At least one must be visible
    const inputVisible = await input.isVisible().catch(() => false);
    const railVisible = await rail.isVisible().catch(() => false);
    expect(inputVisible || railVisible).toBe(true);
  });
});

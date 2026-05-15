import { test, expect } from "@playwright/test";

test.describe("dashboard smoke", () => {
  test("grid page renders TodayStrip + 6 tiles", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Recommend/i)).toBeVisible();
    await expect(page.getByText(/HRV \(today\)/i)).toBeVisible();
    // Six metric tiles
    const tiles = page.locator("a[href^='/metric/']");
    await expect(tiles).toHaveCount(6);
  });

  test("clicking HRV tile navigates to /metric/hrv", async ({ page }) => {
    await page.goto("/");
    await page.locator("a[href='/metric/hrv']").click();
    await expect(page).toHaveURL(/\/metric\/hrv/);
    await expect(page.getByText(/Back to grid/i)).toBeVisible();
  });

  test("workouts page renders header", async ({ page }) => {
    await page.goto("/workouts");
    await expect(page.getByRole("heading", { name: /workouts/i })).toBeVisible();
  });
});

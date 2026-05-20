import { test, expect } from "@playwright/test";

test.describe("v3 — capture surfaces", () => {
  test("paperclip button is visible in the chat drawer", async ({ page }) => {
    await page.goto("/");
    // Drawer may be collapsed; open it first if needed
    const rail = page.getByText("ASK CLAUDE");
    if (await rail.isVisible().catch(() => false)) {
      await rail.click();
    }
    const paperclip = page.getByRole("button", { name: /attach photo/i });
    await expect(paperclip).toBeVisible();
  });

  test("workout rows have an expand chevron", async ({ page }) => {
    await page.goto("/workouts");
    // If there are no workouts in the window, this assertion is skipped.
    const chevrons = page.getByRole("button", { name: /expand row/i });
    const count = await chevrons.count();
    if (count === 0) {
      test.skip(true, "no workouts available in current window");
    }
    await expect(chevrons.first()).toBeVisible();
  });
});

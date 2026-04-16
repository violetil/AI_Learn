import { expect, test } from "@playwright/test";

test("home responds", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /AI Learn/i })).toBeVisible();
});

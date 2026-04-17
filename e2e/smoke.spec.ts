import { expect, test } from "@playwright/test";

test("home responds", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /AI 辅助学习与智能作业批改/i })).toBeVisible();
});

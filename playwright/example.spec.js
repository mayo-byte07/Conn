const { test, expect } = require("@playwright/test");

test("static site responds with 200", async ({ page }) => {
  const response = await page.goto("/");
  expect(response && response.status()).toBe(200);
});

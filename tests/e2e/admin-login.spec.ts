import { expect, test } from "@playwright/test";

test("unauthenticated visitors are redirected from admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Admin login" })).toBeVisible();
});

test("admin login shows an error for a bad password", async ({ page }) => {
  await page.route("**/api/admin/login", async (route) => {
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Invalid password" }) });
  });
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid password")).toBeVisible();
});

import { test, expect } from "@playwright/test";

test("home page links to login and register", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "NSS Connect" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
});

test("verify page reports an unknown certificate hash", async ({ page }) => {
  await page.goto("/verify/does-not-exist");
  await expect(page.getByText("Certificate not found")).toBeVisible();
});

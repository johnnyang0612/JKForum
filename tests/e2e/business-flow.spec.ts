import { test, expect } from "@playwright/test";

test.describe("業者流程 (PRD §3 - 需登入)", () => {
  test.beforeEach(async ({ page }) => {
    // 用 admin 一鍵登入（admin 也是 BUSINESS user）
    await page.goto("/login");
    await page.getByRole("button", { name: /以管理員登入/ }).click();
    await page.waitForURL("**/", { timeout: 8000 });
  });

  test("業者後台主頁顯示 onboarding 與儀表板", async ({ page }) => {
    await page.goto("/business");
    await expect(page.getByRole("heading", { name: /業者儀表板/ })).toBeVisible();
    await expect(page.getByText(/錢包餘額/)).toBeVisible();
    await expect(page.getByText(/廣告總數/)).toBeVisible();
  });

  test("錢包頁可儲值 (demo 即時到帳)", async ({ page }) => {
    await page.goto("/business/wallet");
    await expect(page.getByText(/當前餘額/)).toBeVisible();
    await expect(page.getByText(/折扣碼/)).toBeVisible();
  });

  test("廣告新增表單顯示 5 級 tier", async ({ page }) => {
    await page.goto("/business/ads/new");
    await expect(page.getByText(/刊登版區/)).toBeVisible();
    const body = await page.textContent("body");
    expect(body).toContain("FREE");
    expect(body).toContain("T500");
    expect(body).toContain("T3000");
  });

  test("admin 廣告審核頁可見 PENDING", async ({ page }) => {
    await page.goto("/admin/business-ads");
    await expect(page.getByRole("heading", { name: /業者刊登審核/ })).toBeVisible();
    await expect(page.getByText(/PENDING/)).toBeVisible();
  });

  test("admin 業者營運區塊", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/業者營運/)).toBeVisible();
    await expect(page.getByText(/30 天儲值/)).toBeVisible();
  });
});

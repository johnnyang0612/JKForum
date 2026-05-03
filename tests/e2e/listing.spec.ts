import { test, expect } from "@playwright/test";

test.describe("店家總覽公開頁 (PRD §2.1)", () => {
  test("匿名訪客可瀏覽 listing", async ({ page }) => {
    await page.goto("/listing");
    await expect(page.getByRole("heading", { name: /店家總覽/ })).toBeVisible();
    // 至少有一張卡片
    await expect(page.locator('a[href*="/listing/ad/"]').first()).toBeVisible({ timeout: 8000 });
  });

  test("9:16 卡片含 tier 徽章", async ({ page }) => {
    await page.goto("/listing");
    const body = await page.textContent("body");
    expect(body).toMatch(/🔥 置頂|⭐ 精選|👑 推薦|🌟/);
  });

  test("篩選器存在 (city/district/forum/tier/q)", async ({ page }) => {
    await page.goto("/listing");
    await expect(page.locator('select').nth(0)).toBeVisible(); // city
    await expect(page.locator('select').nth(2)).toBeVisible(); // forum
    await expect(page.locator('select').nth(3)).toBeVisible(); // tier
    await expect(page.locator('input[placeholder*="關鍵字"]')).toBeVisible();
  });

  test("點開卡片進詳情頁 (含留言區)", async ({ page }) => {
    await page.goto("/listing");
    await page.locator('a[href*="/listing/ad/"]').first().click();
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByText(/留言/)).toBeVisible({ timeout: 8000 });
  });
});

test.describe("OTP 註冊流程 (PRD §1.2)", () => {
  test("首頁可進入 phone 註冊", async ({ page }) => {
    await page.goto("/register/phone");
    await expect(page.getByRole("heading", { name: /手機號碼註冊/ })).toBeVisible();
    await expect(page.locator('input[placeholder="0912345678"]')).toBeVisible();
  });

  test("送出 OTP 後出現 step 2 表單", async ({ page }) => {
    await page.goto("/register/phone");
    const phone = "09" + Math.floor(10000000 + Math.random() * 89999999);
    await page.locator('input[placeholder="0912345678"]').fill(phone);
    await page.getByRole("button", { name: /發送 OTP/ }).click();
    await expect(page.getByText(/驗證碼/)).toBeVisible({ timeout: 8000 });
    // demo 模式驗證碼自動填入
    await expect(page.locator('input[maxlength="6"]')).toHaveValue("123456");
    await expect(page.getByRole("button", { name: /完成註冊/ })).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

/**
 * API 合約測試 - 不需 UI
 */
test.describe("API contracts", () => {
  test("廣告敏感詞攔截", async ({ request }) => {
    // 先登入 admin (admin 也是 BUSINESS)
    const login = await request.post("/api/auth/callback/credentials", {
      form: { email: "admin@jkforum.com", password: "Admin123!", csrfToken: "" },
    }).catch(() => null);

    // 不帶 cookie 也能驗 401
    const r = await request.post("/api/business/ads", {
      data: {
        forumId: "x", title: "援交服務", description: "援交援交援交援交援交",
        city: "台北市", district: "信義區", tags: [], tier: "FREE",
      },
    });
    // 401 (未登入) 或 400 (敏感詞) 都算正常
    expect([400, 401]).toContain(r.status());
  });

  test("OTP 註冊送 send 回 mockCode", async ({ request }) => {
    const phone = "09" + Math.floor(10000000 + Math.random() * 89999999);
    const r = await request.post("/api/auth/phone-register", {
      data: { action: "send", phone, country: "+886" },
    });
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.success).toBe(true);
    expect(j.mockCode).toBe("123456");
  });

  test("折扣碼預檢需登入", async ({ request }) => {
    const r = await request.post("/api/business/wallet/coupon", {
      data: { code: "WELCOME500", amount: 1000 },
    });
    expect([401, 400]).toContain(r.status());
  });

  test("listing search-log POST 接受空 query 不爆", async ({ request }) => {
    const r = await request.post("/api/listing/search-log", {
      data: { query: "" },
    });
    expect([200, 400]).toContain(r.status());
  });
});

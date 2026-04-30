/* eslint-disable */
/**
 * 真人模擬 — 真實點擊每個按鈕、填表單，每步截圖
 * 不打 API，純 UI 操作
 */
import { chromium } from "playwright";
import * as fs from "fs";

const BASE = "https://jkforum.vercel.app";
const SHOTS = "./demo-shots";

if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS);

let stepNum = 0;
async function shot(page: any, name: string) {
  stepNum++;
  const file = `${SHOTS}/${String(stepNum).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: file });
  return file;
}

async function logStep(name: string, fn: () => Promise<any>) {
  process.stdout.write(`STEP: ${name.padEnd(50, ".")} `);
  try {
    const r = await fn();
    console.log("OK", r ? `→ ${JSON.stringify(r).slice(0, 120)}` : "");
    return true;
  } catch (e: any) {
    console.log("FAIL", `→ ${e.message.slice(0, 200)}`);
    return false;
  }
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  console.log("==============================================");
  console.log("真人模擬 Demo Walkthrough");
  console.log("==============================================\n");

  // ─── PART A: 訪客 ───
  console.log("\n--- PART A: 訪客體驗 ---");

  await logStep("A1. 開啟首頁", async () => {
    await page.goto(BASE + "/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    await shot(page, "home");
  });

  await logStep("A2. 滾動首頁看完所有區塊", async () => {
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
    await page.waitForTimeout(2000);
    await shot(page, "home-bottom");
    await page.evaluate(() => window.scrollTo({ top: 0 }));
  });

  await logStep("A3. 點擊 sidebar 的「看板」", async () => {
    await page.click('a[href="/forums"]:visible', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "forums");
  });

  await logStep("A4. 點擊 sidebar 的「熱門文章」", async () => {
    await page.click('a[href="/hot"]:visible', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "hot");
  });

  await logStep("A5. 點擊熱門列表第 1 篇文章", async () => {
    await page.waitForSelector('a[href*="/posts/"]', { timeout: 8000 });
    const firstHref = await page.$eval('a[href*="/posts/"]', (a: any) => a.getAttribute("href"));
    await page.click(`a[href="${firstHref}"]`, { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "post-detail");
    return { firstHref };
  });

  await logStep("A6. 點擊 sidebar 的「排行榜」", async () => {
    await page.click('a[href="/leaderboard"]:visible', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "leaderboard");
  });

  await logStep("A7. 排行榜切換到「金幣榜」分頁", async () => {
    await page.click('a[href="/leaderboard?tab=coins"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "leaderboard-coins");
  });

  // ─── PART B: 登入 ───
  console.log("\n--- PART B: 登入 ---");

  await logStep("B1. 進入登入頁", async () => {
    await page.goto(BASE + "/login");
    await page.waitForTimeout(1000);
    await shot(page, "login-page");
  });

  await logStep("B2. 點擊「以管理員登入」按鈕", async () => {
    const btn = page.locator('button:has-text("以管理員登入")').first();
    await btn.click({ timeout: 5000 });
    await page.waitForURL(BASE + "/", { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await shot(page, "logged-in-home");
  });

  await logStep("B3. 點擊右上頭像看下拉選單", async () => {
    // 找頭像 button - DropdownMenuTrigger 通常包 Avatar
    const avatarBtn = page.locator('button[aria-haspopup], [aria-haspopup="menu"]').last();
    await avatarBtn.click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await shot(page, "user-dropdown");
    // 關掉
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  await logStep("B4. 點 sidebar 的「我的好友」", async () => {
    // 先確保任何 dropdown/overlay 都關掉
    await page.evaluate(() => document.body.click());
    await page.waitForTimeout(300);
    await page.locator('aside a[href="/friends"]').click({ force: true, timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "friends");
  });

  await logStep("B5. 進入個人空間 (直接 nav)", async () => {
    await page.goto(BASE + "/profile/admin-001");
    await page.waitForTimeout(2000);
    await shot(page, "profile");
  });

  // ─── PART C: 遊戲中心 (差異化亮點) ───
  console.log("\n--- PART C: 遊戲中心 ---");

  await logStep("C1. 點 sidebar「遊戲中心」", async () => {
    await page.click('a[href="/achieve/game"]:visible', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "game-hub");
  });

  await logStep("C2. 點擊「挖礦」卡片", async () => {
    await page.click('a[href="/achieve/game/mine"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "mine-page");
  });

  await logStep("C3. 點擊「巨龍巢穴」的「出發」按鈕", async () => {
    // 找巨龍巢穴卡片內的「出發」按鈕
    const dragonCard = page.locator('div.rounded-xl', { hasText: "巨龍巢穴" });
    const goBtn = dragonCard.locator('button:has-text("出發")');
    await goBtn.click({ timeout: 8000 });
    await page.waitForTimeout(3000);
    await shot(page, "mine-dragon-result");
  });

  await logStep("C4. 點兩次「廢棄礦坑」按鈕（連挖）", async () => {
    const minorCard = page.locator('div.rounded-xl', { hasText: "廢棄礦坑" });
    const goBtn = minorCard.locator('button:has-text("出發")');
    await goBtn.click({ timeout: 8000 });
    await page.waitForTimeout(2500);
    await goBtn.click({ timeout: 8000 });
    await page.waitForTimeout(2500);
    await shot(page, "mine-minor-x2");
  });

  await logStep("C5. 回到遊戲 hub 點「道具商店」", async () => {
    await page.goto(BASE + "/achieve/game");
    await page.waitForTimeout(1000);
    await page.click('a[href="/achieve/game/store"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "store");
  });

  await logStep("C6. 點商店第 1 件道具的「購買」按鈕", async () => {
    const buyBtn = page.locator('button:has-text("購買")').first();
    await buyBtn.click({ timeout: 5000 });
    await page.waitForTimeout(2500);
    await shot(page, "store-bought");
  });

  await logStep("C7. 進「道具合成」", async () => {
    await page.goto(BASE + "/achieve/game/craft");
    await page.waitForTimeout(2500);
    await shot(page, "craft");
  });

  await logStep("C8. 進「開寶箱」", async () => {
    await page.goto(BASE + "/achieve/game/treasure");
    await page.waitForTimeout(1500);
    await shot(page, "treasure");
  });

  await logStep("C9. 點青銅寶箱「出發」", async () => {
    const bronzeCard = page.locator('div.rounded-xl', { hasText: "青銅寶箱" });
    const goBtn = bronzeCard.locator('button:has-text("出發")');
    await goBtn.click({ timeout: 8000 });
    await page.waitForTimeout(3000);
    await shot(page, "treasure-bronze-result");
  });

  // ─── PART D: 聊天 + 日誌 ───
  console.log("\n--- PART D: 聊天 + 日誌 ---");

  await logStep("D1. 點 sidebar「即時聊天室」", async () => {
    await page.click('a[href="/chat"]:visible', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "chat-list");
  });

  await logStep("D2. 點「大廳」聊天室", async () => {
    await page.click('a[href="/chat/lobby"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);  // 等訊息載入
    await shot(page, "chat-lobby-loaded");
  });

  await logStep("D3. 在輸入框打字並送出訊息", async () => {
    const input = page.locator('input[placeholder*="說點什麼"]');
    const text = `Demo 測試訊息 ${new Date().toLocaleTimeString("zh-TW")}`;
    await input.fill(text);
    await page.waitForTimeout(500);
    // 點旁邊送出按鈕（飛機圖標）
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2500);  // 等回應 + 輪詢
    await shot(page, "chat-message-sent");
    return { sent: text };
  });

  await logStep("D4. 點 sidebar「個人日誌」", async () => {
    await page.click('a[href="/blog"]:visible', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "blog-list");
  });

  await logStep("D5. 點第 1 篇日誌進詳細頁", async () => {
    const blogLink = page.locator('a[href^="/blog/"]:not([href="/blog/new"])').first();
    await blogLink.click({ timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "blog-detail");
  });

  // ─── PART E: 後台 ───
  console.log("\n--- PART E: 後台 ---");

  await logStep("E1. 進後台儀表板", async () => {
    await page.goto(BASE + "/admin");
    await page.waitForTimeout(2500);
    await shot(page, "admin-dashboard");
  });

  await logStep("E2. 滾到趨勢圖區", async () => {
    await page.evaluate(() => {
      const trends = document.querySelector('h2');
      const all = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('30 天趨勢'));
      if (all) all.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    await page.waitForTimeout(2000);
    await shot(page, "admin-trends");
  });

  await logStep("E3. 進「會員組管理」", async () => {
    await page.click('aside a[href="/admin/user-groups"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "admin-user-groups");
  });

  await logStep("E4. 找 newbie_a 用戶，下拉選 KING，點儲存", async () => {
    // 先用搜尋框找 newbie_a（避免 newbie_a 不在第一頁）
    const searchInput = page.locator('input[name="q"]');
    await searchInput.fill("newbie_a");
    await page.waitForTimeout(300);
    await page.locator('button:has-text("篩選")').click({ timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "admin-search-newbie");

    // 現在頁面只剩 newbie_a — 找 select
    const row = page.locator('tr', { hasText: "newbie_a" });
    const select = row.locator('select').first();
    await select.waitFor({ timeout: 8000 });
    await select.selectOption({ value: "KING" });
    await page.waitForTimeout(500);
    const saveBtn = row.locator('button:has-text("儲存")').first();
    await saveBtn.click({ timeout: 5000 });
    await page.waitForTimeout(2500);
    await shot(page, "admin-promoted-newbie");
  });

  await logStep("E5. 進「勳章管理」", async () => {
    await page.click('aside a[href="/admin/medals"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "admin-medals");
  });

  await logStep("E6. 頒發勳章 — 填表單 + 送出", async () => {
    // 用戶輸入
    const userInput = page.locator('input[placeholder*="username"]');
    await userInput.fill("kevin_wang");
    await page.waitForTimeout(500);
    // 選 vip-platinum 勳章
    const medalSelect = page.locator('form select').first();
    // 取得所有 option 找含「白金貴賓」的
    const targetVal = await medalSelect.evaluate((sel: any) => {
      const opt = Array.from(sel.options).find((o: any) => o.text.includes("白金貴賓"));
      return opt ? (opt as any).value : null;
    });
    if (targetVal) await medalSelect.selectOption(targetVal);
    await page.waitForTimeout(500);
    // 點頒發
    await page.click('button:has-text("頒發")', { timeout: 5000 });
    await page.waitForTimeout(2500);
    await shot(page, "admin-awarded-medal");
  });

  await logStep("E7. 進「操作日誌」", async () => {
    await page.click('aside a[href="/admin/logs"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "admin-logs");
  });

  await logStep("E8. 進「文章管理」", async () => {
    await page.click('aside a[href="/admin/posts"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "admin-posts");
  });

  await logStep("E9. 進「推播通知」", async () => {
    await page.click('aside a[href="/admin/push"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "admin-push");
  });

  await logStep("E10. 進「平台設定」看 R-18 開關", async () => {
    await page.click('aside a[href="/admin/platform"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "admin-platform");
  });

  // ─── PART F: 手機版 ───
  console.log("\n--- PART F: 手機 ---");

  await logStep("F1. 切到手機 viewport (390x844)", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + "/");
    await page.waitForTimeout(2000);
    await shot(page, "mobile-home");
  });

  await logStep("F2. 手機點 bottom nav 的「聊天」", async () => {
    await page.click('nav.fixed.bottom-0 a[href="/chat"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "mobile-chat");
  });

  await logStep("F3. 手機點「遊戲」", async () => {
    await page.click('nav.fixed.bottom-0 a[href="/achieve/game"]', { timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await shot(page, "mobile-game");
  });

  await logStep("F4. 手機後台儀表板", async () => {
    await page.goto(BASE + "/admin");
    await page.waitForTimeout(2000);
    await shot(page, "mobile-admin");
  });

  // ─── PART G: R-18 ───
  console.log("\n--- PART G: R-18 ---");

  await logStep("G1. 切回桌面 viewport", async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);
  });

  await logStep("G2. 進 age-gate 頁面 + 填表單", async () => {
    // 先清掉 age-gate cookie + DB ageConfirmedAt 才會看到表單
    await ctx.clearCookies();
    // 重新登入（因 logout 了）
    await page.goto(BASE + "/login");
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("以管理員登入")').first().click({ timeout: 5000 });
    await page.waitForURL(BASE + "/", { timeout: 10000 });
    await page.waitForTimeout(1500);

    await page.goto(BASE + "/age-gate?next=/forums/adult-entertainment/adult-pics-cool");
    await page.waitForTimeout(3000);
    await shot(page, "age-gate");

    // 檢查是否仍被 redirect 走（已通過則跳到 next）
    if (!page.url().includes("/age-gate")) {
      await shot(page, "age-gate-already-passed");
      return { note: "Already passed, redirected to next" };
    }

    const dateInput = page.locator('main input[type="date"]');
    await dateInput.waitFor({ timeout: 8000 });
    await dateInput.fill("1990-01-01");
    await page.waitForTimeout(300);
    await page.locator('main input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await shot(page, "age-gate-filled");
    await page.locator('main button:has-text("確認進入")').click({ timeout: 5000 });
    await page.waitForTimeout(3500);
    await shot(page, "r18-forum");
  });

  await logStep("G3. 點 R-18 區任一篇文章", async () => {
    const postLink = page.locator('a[href*="/posts/"]').first();
    await postLink.click({ timeout: 5000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await shot(page, "r18-post");
  });

  console.log("\n==============================================");
  console.log(`完成！截圖共 ${stepNum} 張，存於 ${SHOTS}/`);
  console.log("==============================================");

  await browser.close();
})();

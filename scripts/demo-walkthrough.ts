/* eslint-disable */
import { chromium } from "playwright";

const BASE = "https://jkforum.vercel.app";

type Step = { name: string; fn: (p: any) => Promise<any> };
const STEPS: Step[] = [];
const step = (name: string, fn: (p: any) => Promise<any>) => STEPS.push({ name, fn });

// PART A: 訪客
step("A1. 首頁載入", async (p) => {
  await p.goto(BASE + "/");
  await p.waitForLoadState("domcontentloaded");
  const h2s = await p.$$eval("h2", (els: any[]) => els.map((e: any) => e.textContent.trim()));
  return { h2Count: h2s.length, sections: h2s.slice(0, 6) };
});
step("A2. 看板列表", async (p) => {
  await p.goto(BASE + "/forums");
  const cats = await p.$$eval("a[href*='/forums/']", (els: any[]) => els.length);
  return { forumLinks: cats };
});
step("A3. 熱門 -> 文章詳細", async (p) => {
  await p.goto(BASE + "/hot");
  await p.waitForSelector("a[href*='/posts/']", { timeout: 8000 });
  const firstPost = await p.$eval("a[href*='/posts/']", (a: any) => a.getAttribute("href"));
  await p.goto(BASE + firstPost);
  await p.waitForSelector("h1", { timeout: 8000 });
  const title = await p.$eval("h1", (e: any) => e.textContent.trim());
  const stars = await p.$$eval("button[aria-label*='星']", (els: any[]) => els.length);
  return { title: title.slice(0, 40), starButtons: stars };
});
step("A4. 排行榜", async (p) => {
  await p.goto(BASE + "/leaderboard");
  const rows = await p.$$eval("a[href^='/profile/']", (els: any[]) => els.length);
  return { rankRows: rows };
});

// PART B: 登入
step("B1. 登入", async (p) => {
  await p.goto(BASE + "/login");
  await p.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b: any) => b.textContent && b.textContent.includes("管理員")
    );
    if (btn) (btn as any).click();
  });
  await p.waitForLoadState("networkidle");
  return { url: p.url() };
});
step("B2. 個人空間", async (p) => {
  await p.goto(BASE + "/profile/admin-001");
  const groupBadge = await p.evaluate(() => {
    const span = Array.from(document.querySelectorAll("span")).find(
      (s: any) => s.textContent && s.textContent.includes("站長組")
    );
    return span ? span.textContent : null;
  });
  const ips = await p.$$eval("span.font-mono", (els: any[]) => els.map((e: any) => e.textContent));
  return { groupBadge, ipCount: ips.length };
});

// PART C: 遊戲中心
step("C1. 遊戲中心 hub", async (p) => {
  await p.goto(BASE + "/achieve/game");
  const cards = await p.$$eval("a[href^='/achieve/game/']", (els: any[]) => els.length);
  return { gameCards: cards };
});
step("C2. 挖礦 - 巨龍巢穴", async (p) => {
  await p.goto(BASE + "/achieve/game/mine");
  await p.waitForTimeout(1500);
  const before = await p.evaluate(async () => {
    const r = await fetch("/api/user/points");
    const j = await r.json();
    return j.data?.energy;
  });
  const result = await p.evaluate(async () => {
    const r = await fetch("/api/game/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: "DRAGON_LAIR" }),
    });
    return r.json();
  });
  return { energyBefore: before, mineSuccess: result.success, rewards: result.rewards?.length, error: result.error };
});
step("C3. 道具商店", async (p) => {
  await p.goto(BASE + "/achieve/game/store");
  await p.waitForTimeout(1500);
  const items = await p.$$eval(".rounded-xl.border-2", (els: any[]) => els.length);
  return { storeItems: items };
});
step("C4. 道具合成", async (p) => {
  await p.goto(BASE + "/achieve/game/craft");
  await p.waitForTimeout(1500);
  const recipes = await p.$$eval("button", (els: any[]) =>
    els.filter((b: any) => b.textContent && b.textContent.trim() === "合成").length
  );
  return { craftButtons: recipes };
});
step("C5. 寶箱", async (p) => {
  await p.goto(BASE + "/achieve/game/treasure");
  await p.waitForTimeout(1000);
  const sites = await p.$$eval("h3", (els: any[]) =>
    els.map((e: any) => e.textContent).filter((t: string) => t && t.includes("寶箱"))
  );
  return { treasureSites: sites.length };
});

// PART D: 聊天 + Blog
step("D1. 聊天室列表", async (p) => {
  await p.goto(BASE + "/chat");
  const rooms = await p.$$eval("a[href^='/chat/']", (els: any[]) => els.length);
  return { rooms };
});
step("D2. 聊天大廳", async (p) => {
  await p.goto(BASE + "/chat/lobby");
  await p.waitForTimeout(3000);
  const msgs = await p.$eval("header span.text-xs", (s: any) => s.textContent).catch(() => null);
  return { messageCounter: msgs };
});
step("D3. 個人日誌", async (p) => {
  await p.goto(BASE + "/blog");
  const blogs = await p.$$eval("a[href^='/blog/']:not([href='/blog/new'])", (els: any[]) => els.length);
  return { blogs };
});

// PART E: 後台
step("E1. 儀表板", async (p) => {
  await p.goto(BASE + "/admin");
  await p.waitForTimeout(1500);
  const statCards = await p.$$eval(".relative.overflow-hidden.rounded-xl", (els: any[]) => els.length);
  const trendSvgs = await p.$$eval("svg path[stroke]", (els: any[]) => els.length);
  return { statCards, trendSvgs };
});
step("E2. 會員組升等", async (p) => {
  await p.goto(BASE + "/admin/user-groups");
  await p.waitForTimeout(1000);
  const result = await p.evaluate(async () => {
    const lookup = await (await fetch("/api/users/lookup?q=newbie_a")).json();
    if (!lookup.user) return { error: "user not found" };
    const r = await fetch("/api/admin/user-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: lookup.user.id, group: "EARL" }),
    });
    return r.json();
  });
  return { promoted: result.success, group: result.group, readPower: result.readPower };
});
step("E3. 勳章頒發", async (p) => {
  await p.goto(BASE + "/admin/medals");
  await p.waitForTimeout(1000);
  const medalCount = await p.$$eval("section .grid > div", (els: any[]) => els.length);
  const result = await p.evaluate(async () => {
    const lookup = await (await fetch("/api/users/lookup?q=foodie_mei")).json();
    if (!lookup.user) return { error: "user not found" };
    const r = await fetch("/api/admin/medals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: lookup.user.id,
        medalSlug: "trend-leader",
      }),
    });
    return r.json();
  });
  return { medalCount, awarded: result.success, error: result.error };
});
step("E4. 操作日誌", async (p) => {
  await p.goto(BASE + "/admin/logs");
  await p.waitForTimeout(1000);
  const logCards = await p.$$eval("div.group", (els: any[]) => els.length);
  const statBadges = await p.$$eval("a[href^='/admin/logs?action=']", (els: any[]) => els.length);
  return { logCards, statBadges };
});
step("E5. 文章管理", async (p) => {
  await p.goto(BASE + "/admin/posts");
  await p.waitForTimeout(1000);
  const rows = await p.$$eval("table tbody tr", (els: any[]) => els.length);
  return { postRows: rows };
});
step("E6. 推播管理", async (p) => {
  await p.goto(BASE + "/admin/push");
  await p.waitForTimeout(1000);
  const subInfo = await p.$$eval("p.text-3xl.font-bold", (els: any[]) => els.map((e: any) => e.textContent));
  return { subscriptions: subInfo };
});

// PART F: 手機
step("F1. 手機首頁", async (p) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(BASE + "/");
  await p.waitForTimeout(1500);
  const docW = await p.evaluate(() => document.documentElement.scrollWidth);
  const navItems = await p.$$eval("nav.fixed.bottom-0 a", (els: any[]) => els.map((a: any) => a.textContent.trim().slice(0, 4)));
  return { docW, navItems, fits: docW <= 392 };
});
step("F2. 手機後台", async (p) => {
  await p.goto(BASE + "/admin");
  await p.waitForTimeout(1500);
  const docW = await p.evaluate(() => document.documentElement.scrollWidth);
  return { docW, fits: docW <= 392 };
});

// PART G: R-18
step("G1. 通過年齡閘", async (p) => {
  await p.setViewportSize({ width: 1280, height: 800 });
  const result = await p.evaluate(async () => {
    const r = await fetch("/api/age-gate/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthdate: "1990-01-01" }),
    });
    return { status: r.status, success: (await r.json()).success };
  });
  return result;
});
step("G2. R-18 寫真區", async (p) => {
  await p.goto(BASE + "/forums/adult-entertainment/adult-pics-cool");
  await p.waitForTimeout(1500);
  const title = await p.$eval("h1", (e: any) => e.textContent.trim()).catch(() => "404 or fail");
  const posts = await p.$$eval("a[href^='/posts/']", (els: any[]) => els.length);
  return { title, posts };
});

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  console.log("============================================================");
  console.log("Demo 路徑 end-to-end 驗證");
  console.log("============================================================");
  let pass = 0, fail = 0;
  const failures: string[] = [];

  for (const s of STEPS) {
    process.stdout.write(s.name.padEnd(40, ".") + " ");
    try {
      const result = await s.fn(page);
      console.log("OK");
      console.log("  ->", JSON.stringify(result).slice(0, 250));
      pass++;
    } catch (e: any) {
      console.log("FAIL");
      console.log("  ->", e.message.slice(0, 200));
      fail++;
      failures.push(s.name + " - " + e.message.slice(0, 80));
    }
  }

  console.log("\n============================================================");
  console.log("PASS " + pass + " / FAIL " + fail + " / TOTAL " + STEPS.length);
  if (failures.length > 0) {
    console.log("Failures:");
    failures.forEach(f => console.log("  - " + f));
  }
  console.log("============================================================");
  await browser.close();
  if (fail > 0) process.exit(1);
})();

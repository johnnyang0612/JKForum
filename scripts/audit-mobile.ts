/* eslint-disable */
import { chromium } from "playwright";

const BASE = "https://jkforum.vercel.app";
const PAGES = [
  "/", "/login", "/forums", "/hot", "/latest", "/follow",
  "/posts/cmojku7yt00civ2ntlp0lq0sh",
  "/chat", "/chat/lobby",
  "/blog", "/blog/cmojk1s3d000s45pf9ofifvin",
  "/achieve/game", "/achieve/game/mine", "/achieve/game/store",
  "/achieve/game/craft", "/achieve/game/inventory", "/achieve/game/medal-craft",
  "/achieve/usergroup",
  "/profile/admin-001", "/profile/admin-001?tab=posts", "/profile/admin-001?tab=album",
  "/settings/profile", "/settings/notifications", "/settings/account", "/settings/privacy",
  "/search?q=美食", "/leaderboard", "/checkin", "/vip", "/shop", "/tasks",
  "/messages", "/notifications", "/friends",
  "/admin", "/admin/users", "/admin/user-groups", "/admin/medals",
  "/admin/forums", "/admin/posts", "/admin/reports",
  "/admin/levels", "/admin/ads", "/admin/shop", "/admin/tasks",
  "/admin/vip", "/admin/platform", "/admin/settings", "/admin/logs", "/admin/push",
  "/team", "/faq", "/flink", "/orders",
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  // Login
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('管理員'));
    if (btn) (btn as HTMLButtonElement).click();
  });
  await page.waitForLoadState("networkidle");

  const issues: any[] = [];
  for (const path of PAGES) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(800);
      const data = await page.evaluate(() => {
        const vw = window.innerWidth;
        const docW = document.documentElement.scrollWidth;
        const overflow = docW - vw;
        // 找溢出的元素
        const overflowing: any[] = [];
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 8 && r.width < vw + 200) {
            overflowing.push({
              tag: el.tagName + '.' + (typeof el.className === 'string' ? el.className.slice(0, 40) : ''),
              right: Math.round(r.right),
              text: el.textContent?.replace(/\s+/g, ' ').slice(0, 40),
            });
          }
        });
        // 找小字
        const tinyText = document.querySelectorAll('[style*="font-size: 9px"], [style*="font-size: 10px"]').length;
        // 表格不 fit
        const overflowTables = Array.from(document.querySelectorAll('table')).filter(t => t.scrollWidth > vw).length;
        return { vw, docW, overflow, overflowingTop: overflowing.slice(0, 3), tinyText, overflowTables };
      });
      const hasIssue = data.overflow > 5 || data.overflowTables > 0 || data.overflowingTop.length > 0;
      issues.push({ path, ...data, hasIssue });
      console.log(`${hasIssue ? '⚠️' : '✅'} ${path} — overflow=${data.overflow} tables=${data.overflowTables}`);
    } catch (e: any) {
      issues.push({ path, error: e.message });
      console.log(`❌ ${path} — ${e.message}`);
    }
  }

  console.log("\n=== 問題清單 ===");
  for (const i of issues.filter(x => x.hasIssue || x.error)) {
    console.log(`${i.path}: overflow=${i.overflow} tables=${i.overflowTables}`);
    if (i.overflowingTop?.length) {
      for (const o of i.overflowingTop) console.log(`  - ${o.tag} right=${o.right} "${o.text}"`);
    }
  }
  await browser.close();
})();

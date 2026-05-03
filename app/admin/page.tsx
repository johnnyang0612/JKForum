import Link from "next/link";
import { db } from "@/lib/db";
import {
  Users, FileText, Flag, Crown, MessageSquare, Heart, BookOpen, Coins,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { GROUPS, getGroupConfig } from "@/lib/user-groups";
import { TrendChart } from "@/components/admin/trend-chart";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "管理後台" };

const DAYS = 30;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);  // YYYY-MM-DD
}

async function buildTrend<T extends { createdAt: Date }>(
  rows: T[]
): Promise<{ x: string; y: number }[]> {
  const map = new Map<string, number>();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    map.set(dayKey(d), 0);
  }
  for (const r of rows) {
    const k = dayKey(r.createdAt);
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map, ([x, y]) => ({ x, y }));
}

async function getStats() {
  const since = new Date(Date.now() - DAYS * 86400000);

  const [
    totalUsers,
    totalPosts,
    totalReplies,
    totalLikes,
    totalBlogs,
    totalCoins,
    pendingReports,
    todayPosts,
    activeUsers,

    userTrend,
    postTrend,
    replyTrend,
    likeTrend,

    groupCounts,
    topForums,
    recentUsers,
    recentPosts,
    recentLogs,
  ] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE" } }),
    db.post.count({ where: { status: "PUBLISHED" } }),
    db.reply.count({ where: { status: "PUBLISHED" } }),
    db.like.count(),
    db.blog.count({ where: { isPublic: true } }),
    db.userPoints.aggregate({ _sum: { coins: true } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.post.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: "PUBLISHED",
      },
    }),
    db.user.count({
      where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    }),

    // 趨勢 raw 資料
    db.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.post.findMany({
      where: { createdAt: { gte: since }, status: "PUBLISHED" },
      select: { createdAt: true },
    }),
    db.reply.findMany({
      where: { createdAt: { gte: since }, status: "PUBLISHED" },
      select: { createdAt: true },
    }),
    db.like.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),

    // 用戶組分布
    db.user.groupBy({
      by: ["userGroup"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
    // 看板熱度 TOP 10
    db.forum.findMany({
      where: { isVisible: true },
      orderBy: { postCount: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        postCount: true,
        rating: true,
        category: { select: { slug: true } },
      },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        displayName: true,
        username: true,
        createdAt: true,
        userGroup: true,
      },
    }),
    db.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        createdAt: true,
        viewCount: true,
        author: { select: { displayName: true } },
      },
    }),
    db.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        admin: { select: { displayName: true } },
      },
    }),
  ]);

  // PRD-0503 V1.1：業者收入統計（過去 30 天）
  const [depositSum, depositTrend, businessAdsTotal, pendingBusinessAds, pendingKyc, pendingWithdrawals] = await Promise.all([
    db.businessWalletTx.aggregate({
      where: { type: "DEPOSIT", createdAt: { gte: since } },
      _sum: { amount: true },
    }),
    db.businessWalletTx.findMany({
      where: { type: "DEPOSIT", createdAt: { gte: since } },
      select: { createdAt: true, amount: true },
    }),
    db.businessAd.count(),
    db.businessAd.count({ where: { status: "PENDING" } }),
    db.user.count({
      where: {
        userType: "BUSINESS", merchantVerified: false,
        merchantVerifiedDocs: { not: [] },
      },
    }),
    db.withdrawalRequest.count({ where: { status: "PENDING" } }),
  ]);
  const depositTrendDaily = await (async () => {
    const map = new Map<string, number>();
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      map.set(dayKey(d), 0);
    }
    for (const r of depositTrend) {
      const k = dayKey(r.createdAt);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + r.amount);
    }
    return Array.from(map, ([x, y]) => ({ x, y }));
  })();

  return {
    totals: {
      totalUsers,
      totalPosts,
      totalReplies,
      totalLikes,
      totalBlogs,
      totalCoins: totalCoins._sum.coins ?? 0,
      pendingReports,
      todayPosts,
      activeUsers,
    },
    trends: {
      users: await buildTrend(userTrend),
      posts: await buildTrend(postTrend),
      replies: await buildTrend(replyTrend),
      likes: await buildTrend(likeTrend),
    },
    groupCounts,
    topForums,
    recentUsers,
    recentPosts,
    recentLogs,
    business: {
      depositSum: depositSum._sum.amount ?? 0,
      depositTrend: depositTrendDaily,
      businessAdsTotal,
      pendingBusinessAds,
      pendingKyc,
      pendingWithdrawals,
    },
  };
}

export default async function AdminDashboard() {
  const data = await getStats();
  const t = data.totals;

  const statCards = [
    { label: "活躍會員", value: t.totalUsers, sub: `週活躍 ${t.activeUsers}`, icon: Users, color: "text-blue-500", bg: "from-blue-500/20 to-blue-500/5" },
    { label: "總文章數", value: t.totalPosts, sub: `今日 ${t.todayPosts}`, icon: FileText, color: "text-emerald-500", bg: "from-emerald-500/20 to-emerald-500/5" },
    { label: "總回覆數", value: t.totalReplies, sub: "全站累計", icon: MessageSquare, color: "text-violet-500", bg: "from-violet-500/20 to-violet-500/5" },
    { label: "總讚數",   value: t.totalLikes, sub: "互動指標", icon: Heart, color: "text-rose-500", bg: "from-rose-500/20 to-rose-500/5" },
    { label: "個人日誌", value: t.totalBlogs, sub: "公開篇數", icon: BookOpen, color: "text-indigo-500", bg: "from-indigo-500/20 to-indigo-500/5" },
    { label: "金幣流通", value: t.totalCoins, sub: "全站總和", icon: Coins, color: "text-amber-500", bg: "from-amber-500/20 to-amber-500/5" },
    { label: "待處理檢舉", value: t.pendingReports, sub: t.pendingReports > 0 ? "需處理" : "✅", icon: Flag, color: "text-red-500", bg: "from-red-500/20 to-red-500/5" },
    { label: "頂級會員", value: data.groupCounts.find(g => g.userGroup === "ADMIN_GRP")?._count._all ?? 0, sub: "站長組人數", icon: Crown, color: "text-yellow-500", bg: "from-yellow-500/20 to-yellow-500/5" },
  ];

  // 計算 group 人數最大值供長條圖用
  const groupTotal = data.groupCounts.reduce((s, g) => s + g._count._all, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">📊 儀表板</h1>
        <p className="mt-1 text-sm text-muted-foreground">過去 30 天總覽</p>
      </header>

      {/* 統計卡 — 手機 2 欄、平板 2、桌面 4 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${c.bg} p-3 sm:p-4`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground sm:text-sm">{c.label}</p>
              <c.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${c.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold sm:text-3xl">{formatNumber(c.value)}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* PRD-0503: 業者營運指標 */}
      <section className="rounded-2xl border bg-gradient-to-br from-amber-500/5 to-transparent p-4">
        <h2 className="mb-3 text-lg font-bold">🏢 業者營運（PRD-0503）</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">30 天儲值</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">NT$ {formatNumber(data.business.depositSum)}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">廣告總數</p>
            <p className="mt-1 text-2xl font-bold">{data.business.businessAdsTotal}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">待審核</p>
            <p className={`mt-1 text-2xl font-bold ${data.business.pendingBusinessAds > 0 ? "text-rose-400" : ""}`}>
              {data.business.pendingBusinessAds}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              KYC {data.business.pendingKyc} ｜ 提現 {data.business.pendingWithdrawals}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <Link href="/admin/business-ads" className="text-xs text-primary hover:underline">→ 廣告審核</Link>
            <Link href="/admin/business-kyc" className="mt-1 block text-xs text-primary hover:underline">→ KYC 審核</Link>
            <Link href="/admin/withdrawals" className="mt-1 block text-xs text-primary hover:underline">→ 提現審核</Link>
            <Link href="/admin/coupons" className="mt-1 block text-xs text-primary hover:underline">→ 折扣碼</Link>
          </div>
        </div>
        <div className="mt-3">
          <TrendChart title="儲值收入 (NT$)" color="#fbbf24" data={data.business.depositTrend} />
        </div>
      </section>

      {/* 趨勢圖 */}
      <section>
        <h2 className="mb-3 text-lg font-bold">📈 30 天趨勢</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TrendChart
            title="新註冊用戶"
            color="#3b82f6"
            data={data.trends.users}
          />
          <TrendChart
            title="新發文章"
            color="#10b981"
            data={data.trends.posts}
          />
          <TrendChart
            title="新增回覆"
            color="#8b5cf6"
            data={data.trends.replies}
          />
          <TrendChart
            title="新增讚數"
            color="#f43f5e"
            data={data.trends.likes}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 用戶組分布 */}
        <section className="rounded-xl border bg-card p-5">
          <h3 className="mb-3 font-bold">👥 會員組分布</h3>
          <div className="space-y-1.5">
            {GROUPS.map((g) => {
              const count = data.groupCounts.find((x) => x.userGroup === g.group)?._count._all ?? 0;
              const pct = groupTotal > 0 ? (count / groupTotal) * 100 : 0;
              if (count === 0) return null;
              return (
                <div key={g.group} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span>
                      {g.iconEmoji} {g.label}
                    </span>
                    <span className="text-muted-foreground">
                      {count} <span className="opacity-50">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 看板熱度 TOP 10 */}
        <section className="rounded-xl border bg-card p-5">
          <h3 className="mb-3 font-bold">🔥 熱門看板（TOP 10）</h3>
          <ol className="space-y-1.5 text-sm">
            {data.topForums.map((f, i) => {
              const max = data.topForums[0]?.postCount ?? 1;
              const pct = (f.postCount / max) * 100;
              const medal = ["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`;
              return (
                <li key={f.id} className="text-xs">
                  <Link
                    href={`/forums/${f.category.slug}/${f.slug}`}
                    className="flex items-center justify-between hover:text-primary"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{medal}</span>
                      {f.name}
                      {f.rating === "R18" && (
                        <span className="rounded bg-rose-500/10 px-1 text-[9px] text-rose-400">18+</span>
                      )}
                    </span>
                    <span className="text-muted-foreground">{f.postCount}</span>
                  </Link>
                  <div className="mt-0.5 h-1 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 最近註冊用戶 */}
        <section className="rounded-xl border bg-card p-3 sm:p-5">
          <h3 className="mb-3 font-bold">🆕 最近註冊用戶</h3>
          <ul className="space-y-2 text-sm">
            {data.recentUsers.map((u) => {
              const cfg = getGroupConfig(u.userGroup);
              return (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <Link href={`/profile/${u.id}`} className="min-w-0 flex-1 truncate hover:text-primary">
                    <span className="font-medium">{u.displayName}</span>
                    <span className="ml-1 text-xs text-muted-foreground">@{u.username}</span>
                    <span className="ml-2 whitespace-nowrap rounded-full border px-1.5 text-[10px]">
                      {cfg.iconEmoji} {cfg.label}
                    </span>
                  </Link>
                  <span className="flex-none text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("zh-TW", {month:"2-digit",day:"2-digit"})}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 最近文章 */}
        <section className="rounded-xl border bg-card p-3 sm:p-5">
          <h3 className="mb-3 font-bold">📝 最近發表文章</h3>
          <ul className="space-y-2 text-sm">
            {data.recentPosts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <Link href={`/posts/${p.id}`} className="min-w-0 flex-1 truncate hover:text-primary">
                  {p.title}
                </Link>
                <span className="flex-none whitespace-nowrap text-xs text-muted-foreground">
                  {p.viewCount} 閱
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 最近管理操作 */}
      <section className="rounded-xl border bg-card p-3 sm:p-5">
        <div className="mb-3 flex items-end justify-between">
          <h3 className="font-bold">⚡ 最近管理操作</h3>
          <Link href="/admin/logs" className="text-xs text-muted-foreground hover:text-primary">
            完整日誌 →
          </Link>
        </div>
        <ul className="space-y-1 text-sm">
          {data.recentLogs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/50"
            >
              <span className="text-xs">
                <b>{log.admin.displayName}</b>{" "}
                <span className="text-muted-foreground">{log.action}</span>{" "}
                <code className="text-[10px] opacity-60">
                  {log.targetType.toLowerCase()} / {log.targetId.slice(0, 8)}…
                </code>
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(log.createdAt).toLocaleString("zh-TW", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
          {data.recentLogs.length === 0 && (
            <li className="text-xs text-muted-foreground">無記錄</li>
          )}
        </ul>
      </section>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PointsPanel } from "@/components/profile/points-panel";
import { Coins } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "我的積分" };

const ACTION_LABELS: Record<string, string> = {
  login: "每日登入",
  checkin: "每日簽到",
  post_create: "發表文章",
  reply_create: "發表回覆",
  like_post: "按讚文章",
  like_reply: "按讚回覆",
  post_liked: "文章被讚",
  reply_liked: "回覆被讚",
  tip_post: "打賞文章",
  post_featured: "文章被精華",
  vote_join: "參與投票",
  avatar_change: "變更頭像",
  signature_change: "變更簽名",
};

function deltaToString(delta: unknown): string {
  if (!delta || typeof delta !== "object") return "";
  const d = delta as Record<string, number>;
  const parts: string[] = [];
  const labels: Record<string, string> = {
    reputation: "名聲",
    coins: "金幣",
    hearts: "愛心",
    given: "送出",
    energy: "體力",
    gems: "寶石",
    platinum: "白金幣",
  };
  for (const [k, v] of Object.entries(d)) {
    if (v && typeof v === "number") {
      parts.push(`${labels[k] || k} ${v > 0 ? "+" : ""}${v}`);
    }
  }
  return parts.join("、");
}

export default async function MyCreditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [points, recentLedger, rules] = await Promise.all([
    db.userPoints.findUnique({ where: { userId: session.user.id } }),
    db.pointLedger.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.pointRule.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <Coins className="h-8 w-8 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold">我的積分</h1>
          <p className="text-sm text-muted-foreground">
            所有積分變動紀錄 + 獲得規則
          </p>
        </div>
      </header>

      {points && (
        <PointsPanel
          points={{
            reputation: points.reputation,
            coins: points.coins,
            platinum: points.platinum,
            hearts: points.hearts,
            gems: points.gems,
            given: points.given,
            energy: points.energy,
            invites: points.invites,
            totalPoints: points.totalPoints,
          }}
        />
      )}

      {/* Ledger */}
      <section className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">積分紀錄（最近 50 筆）</h2>
        {recentLedger.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            還沒有積分變動紀錄 — 每日登入、發文、按讚都會累積
          </p>
        ) : (
          <ul className="divide-y">
            {recentLedger.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">
                    {ACTION_LABELS[l.action] || l.action}
                  </div>
                  {l.note && (
                    <div className="text-xs text-muted-foreground">{l.note}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-600 dark:text-emerald-400">
                    {deltaToString(l.delta)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString("zh-TW")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rules */}
      <section className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">積分策略</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          依下列規則獲得積分（週期內達上限後不再累積）
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3">動作</th>
                <th className="pb-2 pr-3">週期</th>
                <th className="pb-2 pr-3 text-center">上限</th>
                <th className="pb-2 pr-3 text-right">名聲</th>
                <th className="pb-2 pr-3 text-right">金幣</th>
                <th className="pb-2 pr-3 text-right">愛心</th>
                <th className="pb-2 pr-3 text-right">送出</th>
                <th className="pb-2 text-right">體力</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 pr-3">{ACTION_LABELS[r.action] || r.action}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {r.cycle || "-"}
                  </td>
                  <td className="py-2 pr-3 text-center text-muted-foreground">
                    {r.maxTimes ?? "-"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">
                    {r.rewardReputation || "-"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">
                    {r.rewardCoins || "-"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">
                    {r.rewardHearts || "-"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">
                    {r.rewardGiven || "-"}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {r.rewardEnergy || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

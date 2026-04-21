import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Receipt, Coins, Crown } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "我的訂單" };

const PLAN_LABELS: Record<string, string> = {
  MONTHLY: "VIP 月卡",
  QUARTERLY: "VIP 季卡",
  YEARLY: "VIP 年卡",
};
const PLAN_PRICE: Record<string, number> = {
  MONTHLY: 99,
  QUARTERLY: 249,
  YEARLY: 799,
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [subs, unlocks, tips] = await Promise.all([
    db.vipSubscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.postUnlock.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: "desc" },
      take: 50,
      include: {
        post: {
          select: { id: true, title: true, author: { select: { displayName: true } } },
        },
      },
    }),
    db.tip.findMany({
      where: { fromId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        post: {
          select: { id: true, title: true },
        },
      },
    }),
  ]);

  const now = new Date();

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <Receipt className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">我的訂單</h1>
          <p className="text-sm text-muted-foreground">
            VIP 訂閱、付費文章解鎖、打賞紀錄
          </p>
        </div>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Crown className="h-5 w-5 text-yellow-500" />
          VIP 訂閱
        </h2>
        {subs.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
            尚無訂閱紀錄
          </div>
        ) : (
          <div className="space-y-2">
            {subs.map((s) => {
              const active = s.status === "ACTIVE" && s.endDate > now;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                >
                  <div>
                    <div className="font-medium">
                      {PLAN_LABELS[s.plan] || s.plan}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(s.startDate)} ~ {formatDate(s.endDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">
                      NT${formatNumber(PLAN_PRICE[s.plan] || 0)}
                    </div>
                    {active ? (
                      <Badge variant="success">有效中</Badge>
                    ) : s.status === "CANCELLED" ? (
                      <Badge variant="destructive">已取消</Badge>
                    ) : (
                      <Badge variant="secondary">已過期</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Coins className="h-5 w-5 text-amber-500" />
          付費解鎖
        </h2>
        {unlocks.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
            尚無付費解鎖紀錄
          </div>
        ) : (
          <div className="space-y-2">
            {unlocks.map((u) => (
              <div
                key={u.postId}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={`/posts/${u.post.id}`}
                    className="block truncate font-medium hover:text-primary"
                  >
                    {u.post.title}
                  </a>
                  <div className="text-xs text-muted-foreground">
                    作者：{u.post.author.displayName} ·{" "}
                    {new Date(u.unlockedAt).toLocaleString("zh-TW")}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-sm">
                  -{u.paidCoins} 金幣
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          🎁 我送出的打賞
        </h2>
        {tips.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
            尚未打賞過其他作者
          </div>
        ) : (
          <div className="space-y-2">
            {tips.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  {t.post ? (
                    <a
                      href={`/posts/${t.post.id}`}
                      className="block truncate font-medium hover:text-primary"
                    >
                      {t.post.title}
                    </a>
                  ) : (
                    <div className="text-muted-foreground">（文章已刪除）</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString("zh-TW")}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-sm text-pink-500">
                  -{t.amount} 金幣
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

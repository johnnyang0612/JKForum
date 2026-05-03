import { db } from "@/lib/db";
import { MedalAwardForm } from "@/components/admin/medal-award-form";
import { ItemIcon } from "@/components/game/item-icon";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "勳章管理" };

export default async function AdminMedalsPage() {
  const medals = await db.medal.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { tier: "asc" }, { name: "asc" }],
  });
  // 各勳章持有人數
  const counts = await db.userMedal.groupBy({
    by: ["medalId"],
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.medalId, c._count._all]));

  // 最近 10 筆頒發紀錄
  const recent = await db.userMedal.findMany({
    orderBy: { awardedAt: "desc" },
    take: 10,
    include: { medal: true },
  });
  const recentUsers = recent.length
    ? await db.user.findMany({
        where: { id: { in: recent.map((r) => r.userId) } },
        select: { id: true, username: true, displayName: true },
      })
    : [];
  const userMap = new Map(recentUsers.map((u) => [u.id, u]));

  // group by category
  const grouped = medals.reduce((acc: Record<string, typeof medals>, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">勳章管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          手動頒發或收回勳章；管理勳章定義
        </p>
      </header>

      {/* 頒發表單 */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-bold">頒發勳章</h2>
        <MedalAwardForm
          medals={medals.map((m) => ({ slug: m.slug, name: m.name, iconEmoji: m.iconEmoji ?? "🏅" }))}
        />
      </section>

      {/* 勳章列表 */}
      <section className="space-y-4">
        <h2 className="font-bold">勳章定義（共 {medals.length} 枚）</h2>
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <h3 className="mb-2 text-sm font-bold text-muted-foreground">{cat}</h3>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {list.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-2 rounded-lg border bg-card p-3"
                >
                  <ItemIcon iconUrl={m.iconUrl} iconEmoji={m.iconEmoji} alt={m.name} size={32} />
                  <div className="flex-1 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">{m.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {countMap.get(m.id) ?? 0} 人持有
                      </div>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {m.tier} · {m.slug}
                    </div>
                    {m.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {m.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 最近頒發紀錄 */}
      <section>
        <h2 className="mb-3 font-bold">最近頒發</h2>
        <ul className="divide-y rounded-xl border bg-card text-sm">
          {recent.map((r) => {
            const u = userMap.get(r.userId);
            return (
              <li key={`${r.userId}-${r.medalId}`} className="flex items-center justify-between px-4 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <ItemIcon iconUrl={r.medal.iconUrl} iconEmoji={r.medal.iconEmoji} alt={r.medal.name} size={20} />
                  {r.medal.name}
                  <span className="ml-2 text-xs text-muted-foreground">→</span>{" "}
                  <span className="text-xs">@{u?.username ?? r.userId}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.awardedAt).toLocaleString("zh-TW")}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

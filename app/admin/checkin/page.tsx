import Link from "next/link";
import { db } from "@/lib/db";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "簽到查詢" };

export default async function AdminCheckinPage({
  searchParams,
}: { searchParams: { q?: string; userId?: string } }) {
  const q = searchParams.q?.trim();
  const userId = searchParams.userId;

  let user: { id: string; displayName: string; email: string } | null = null;
  let checkins: Array<{ id: string; date: Date; streak: number; coinsEarned: number; createdAt: Date }> = [];
  let totalCheckins = 0;
  let longestStreak = 0;

  if (q) {
    // 搜尋使用者（username / email / displayName）
    user = await db.user.findFirst({
      where: {
        OR: [
          { username: { equals: q, mode: "insensitive" } },
          { email: { equals: q, mode: "insensitive" } },
          { displayName: { equals: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, displayName: true, email: true },
    });
  } else if (userId) {
    user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, email: true },
    });
  }

  if (user) {
    const [list, total] = await Promise.all([
      db.checkin.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 100,
      }),
      db.checkin.count({ where: { userId: user.id } }),
    ]);
    checkins = list;
    totalCheckins = total;
    longestStreak = list.reduce((m, c) => Math.max(m, c.streak), 0);
  }

  // 30 天內全站簽到統計
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const last30dCount = await db.checkin.count({ where: { date: { gte: since } } });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">簽到查詢</h1>
      </div>

      <div className="rounded-lg border bg-card p-4 text-sm">
        <p className="text-muted-foreground">
          全站近 30 天簽到次數：<strong className="text-foreground">{last30dCount.toLocaleString()}</strong>
        </p>
      </div>

      <form className="flex gap-2 text-sm">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="輸入 username / email / 顯示名稱"
          className="flex-1 rounded border bg-background px-3 py-2"
        />
        <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">查詢</button>
      </form>

      {q && !user && (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          找不到使用者「{q}」
        </div>
      )}

      {user && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="font-bold">
              <Link href={`/admin/users/${user.id}`} className="text-primary hover:underline">
                {user.displayName}
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-2 text-sm">
              總簽到次數：<strong>{totalCheckins}</strong> ·
              歷史最長連簽：<strong>{longestStreak}</strong> 天
            </p>
            <form action={`/api/admin/checkin/reset`} method="POST" className="pt-2">
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit"
                className="rounded border border-destructive/50 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                onClick={(e) => { if (!confirm("清空此使用者所有簽到紀錄？此操作不可復原。")) e.preventDefault(); }}>
                重置全部簽到（不退已發金幣）
              </button>
            </form>
          </div>

          <div className="md:overflow-x-auto md:rounded-lg md:border">
            <table className="responsive-table w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-2 text-left">日期</th>
                  <th className="p-2 text-left">連續</th>
                  <th className="p-2 text-right">當次金幣</th>
                  <th className="p-2 text-left">建立時間</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/20">
                    <td data-label="日期" className="p-2 whitespace-nowrap">
                      {new Date(c.date).toLocaleDateString("zh-TW")}
                    </td>
                    <td data-label="連續" className="p-2">{c.streak} 天</td>
                    <td data-label="當次金幣" className="p-2 text-right text-success">+{c.coinsEarned}</td>
                    <td data-label="建立時間" className="p-2 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString("zh-TW")}
                    </td>
                  </tr>
                ))}
                {checkins.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">無簽到紀錄</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

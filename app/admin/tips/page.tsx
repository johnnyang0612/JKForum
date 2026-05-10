import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "打賞紀錄" };

export default async function AdminTipsPage({
  searchParams,
}: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 50;

  const [tips, total, sum30d] = await Promise.all([
    db.tip.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
    }),
    db.tip.count(),
    db.tip.aggregate({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      _sum: { amount: true },
    }),
  ]);

  const userIds = Array.from(new Set([...tips.flatMap((t) => [t.fromId, t.toId])]));
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true },
  });
  const uMap = Object.fromEntries(users.map((u) => [u.id, u.displayName]));
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">💝 打賞紀錄</h1>
        <p className="text-sm text-muted-foreground mt-1">
          30 天內打賞總額：<strong>{(sum30d._sum.amount ?? 0).toLocaleString()}</strong> 金幣 ・共 {total.toLocaleString()} 筆
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">時間</th>
              <th className="p-2 text-left">打賞者</th>
              <th className="p-2 text-left">收受者</th>
              <th className="p-2 text-right">金額</th>
              <th className="p-2 text-left">關聯</th>
              <th className="p-2 text-left">留言</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((t) => (
              <tr key={t.id} className="border-b hover:bg-muted/20">
                <td className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(t.createdAt).toLocaleString("zh-TW")}
                </td>
                <td className="p-2">
                  <Link href={`/admin/users/${t.fromId}`} className="text-primary hover:underline">
                    {uMap[t.fromId] ?? t.fromId.slice(0, 8)}
                  </Link>
                </td>
                <td className="p-2">
                  <Link href={`/admin/users/${t.toId}`} className="text-primary hover:underline">
                    {uMap[t.toId] ?? t.toId.slice(0, 8)}
                  </Link>
                </td>
                <td className="p-2 text-right font-mono">{t.amount.toLocaleString()}</td>
                <td className="p-2 text-xs text-muted-foreground">
                  {t.postId ? <Link href={`/posts/${t.postId}`} className="hover:underline">post:{t.postId.slice(0, 8)}</Link> : "-"}
                </td>
                <td className="p-2 text-xs text-muted-foreground">{t.message ?? "-"}</td>
              </tr>
            ))}
            {tips.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">尚無打賞紀錄</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={`?page=${page - 1}`} className="rounded border px-3 py-1 hover:bg-muted">上一頁</Link>}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`?page=${page + 1}`} className="rounded border px-3 py-1 hover:bg-muted">下一頁</Link>}
        </div>
      )}
    </div>
  );
}

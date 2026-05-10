import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "業者廣告留言" };

export default async function AdminBusinessAdCommentsPage({
  searchParams,
}: { searchParams: { q?: string; page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 50;
  const q = searchParams.q?.trim();

  const where: Record<string, unknown> = {};
  if (q) where.content = { contains: q, mode: "insensitive" };

  const [comments, total] = await Promise.all([
    db.businessAdComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
    }),
    db.businessAdComment.count({ where }),
  ]);

  const userIds = Array.from(new Set(comments.map((c) => c.userId)));
  const adIds = Array.from(new Set(comments.map((c) => c.adId)));
  const [users, ads] = await Promise.all([
    db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, displayName: true } }),
    db.businessAd.findMany({ where: { id: { in: adIds } }, select: { id: true, title: true, merchantId: true } }),
  ]);
  const uMap = Object.fromEntries(users.map((u) => [u.id, u.displayName]));
  const adMap = Object.fromEntries(ads.map((a) => [a.id, a]));
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">📝 業者廣告留言</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} 則留言</p>
      </div>

      <form className="flex gap-2 text-sm">
        <input name="q" defaultValue={q ?? ""} placeholder="搜尋留言內容…"
          className="flex-1 rounded border bg-background px-3 py-2" />
        <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">搜尋</button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">時間</th>
              <th className="p-2 text-left">留言者</th>
              <th className="p-2 text-left">廣告</th>
              <th className="p-2 text-left">內容</th>
              <th className="p-2 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id} className="border-b hover:bg-muted/20">
                <td className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString("zh-TW")}
                </td>
                <td className="p-2">
                  <Link href={`/admin/users/${c.userId}`} className="text-primary hover:underline">
                    {uMap[c.userId] ?? c.userId.slice(0, 8)}
                  </Link>
                </td>
                <td className="p-2 max-w-[200px] truncate">
                  {adMap[c.adId] ? (
                    <Link href={`/listing/ad/${c.adId}`} className="hover:underline" title={adMap[c.adId]?.title}>
                      {adMap[c.adId]?.title}
                    </Link>
                  ) : "—"}
                </td>
                <td className="p-2 max-w-[400px] truncate text-muted-foreground" title={c.content}>{c.content}</td>
                <td className="p-2">
                  <form action={`/api/admin/business-ad-comments/${c.id}/delete`} method="POST">
                    <button type="submit"
                      className="text-xs text-destructive hover:underline"
                      onClick={(e) => { if (!confirm("刪除此留言？")) e.preventDefault(); }}>
                      刪除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {comments.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">無留言</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`} className="rounded border px-3 py-1">上一頁</Link>}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`} className="rounded border px-3 py-1">下一頁</Link>}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { Star } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "廣告評分審核" };

export default async function AdminAdRatingsPage({
  searchParams,
}: { searchParams: { score?: string; adId?: string; userId?: string; page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 50;

  const where: Record<string, unknown> = {};
  if (searchParams.score) {
    const s = Number(searchParams.score);
    if (Number.isFinite(s) && s >= 1 && s <= 5) where.score = s;
  }
  if (searchParams.adId) where.adId = searchParams.adId;
  if (searchParams.userId) where.userId = searchParams.userId;

  const [ratings, total, lowScoreCount, recent7d] = await Promise.all([
    db.businessAdRating.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.businessAdRating.count({ where }),
    db.businessAdRating.count({ where: { score: { lte: 2 } } }),
    db.businessAdRating.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
    }),
  ]);

  const adIds = Array.from(new Set(ratings.map((r) => r.adId)));
  const userIds = Array.from(new Set(ratings.map((r) => r.userId)));
  const [ads, users] = await Promise.all([
    adIds.length > 0
      ? db.businessAd.findMany({
          where: { id: { in: adIds } },
          select: { id: true, title: true, merchantId: true },
        })
      : [],
    userIds.length > 0
      ? db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, displayName: true, email: true },
        })
      : [],
  ]);
  const adMap = Object.fromEntries(ads.map((a) => [a.id, a]));
  const uMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">⭐ 廣告評分審核</h1>
        <p className="text-sm text-muted-foreground mt-1">
          全站 {total.toLocaleString()} 筆 · 低分（≤2）：
          <strong className="text-destructive">{lowScoreCount}</strong> ·
          近 7 天：{recent7d}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/ad-ratings"
          className={`rounded border px-3 py-1 ${!searchParams.score ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
          全部分數
        </Link>
        {[1, 2, 3, 4, 5].map((s) => (
          <Link key={s} href={`/admin/ad-ratings?score=${s}`}
            className={`rounded border px-3 py-1 ${searchParams.score === String(s) ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {s} ★
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {ratings.map((r) => {
          const ad = adMap[r.adId];
          const u = uMap[r.userId];
          return (
            <div key={r.id} className="rounded-lg border bg-card p-3 text-sm">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: r.score }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                  <span className="ml-1 text-muted-foreground">{r.score} ★</span>
                </span>
                <span>{new Date(r.createdAt).toLocaleString("zh-TW")}</span>
              </div>
              <p className="mt-1">
                <Link href={ad ? `/listing/ad/${ad.id}` : "#"} className="font-medium hover:underline">
                  {ad?.title ?? "（廣告已刪）"}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">
                  by{" "}
                  {u ? (
                    <Link href={`/admin/users/${u.id}`} className="text-primary hover:underline">{u.displayName}</Link>
                  ) : "（user 已刪）"}
                </span>
              </p>
              {r.comment && (
                <p className="mt-1 rounded bg-muted/40 p-2 text-xs whitespace-pre-wrap">{r.comment}</p>
              )}
              {r.merchantReply && (
                <p className="mt-1 rounded bg-primary/5 border-l-2 border-primary p-2 text-xs">
                  <span className="font-bold text-primary">業者回覆：</span>{r.merchantReply}
                </p>
              )}
              <div className="mt-2 flex justify-end">
                <form action={`/api/admin/ad-ratings/${r.id}/delete`} method="POST">
                  <button type="submit"
                    className="rounded border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                    onClick={(e) => { if (!confirm("刪除此評分？會自動重算廣告的 ratingAvg/Count。")) e.preventDefault(); }}>
                    刪除惡意評分
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {ratings.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">無資料</div>
        )}
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

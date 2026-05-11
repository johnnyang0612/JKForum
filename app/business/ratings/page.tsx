import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Star, MessageSquare } from "lucide-react";
import { BusinessRatingReply } from "@/components/business/business-rating-reply";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "我收到的評分" };

export default async function BusinessRatingsPage({
  searchParams,
}: { searchParams: { unanswered?: string; adId?: string; page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 30;

  // 抓我所有廣告 id
  const myAds = await db.businessAd.findMany({
    where: { merchantId: session.user.id },
    select: { id: true, title: true, ratingAvg: true, ratingCount: true },
    orderBy: { createdAt: "desc" },
  });
  const myAdIds = myAds.map((a) => a.id);

  if (myAdIds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">⭐ 我收到的評分</h1>
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          你還沒有任何廣告，刊登後消費者就能評分。
        </div>
      </div>
    );
  }

  const where: Record<string, unknown> = { adId: { in: myAdIds } };
  if (searchParams.adId && myAdIds.includes(searchParams.adId)) {
    where.adId = searchParams.adId;
  }
  if (searchParams.unanswered === "1") {
    where.merchantReply = null;
  }

  const [ratings, total, unansweredCount] = await Promise.all([
    db.businessAdRating.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.businessAdRating.count({ where }),
    db.businessAdRating.count({ where: { adId: { in: myAdIds }, merchantReply: null } }),
  ]);

  const userIds = Array.from(new Set(ratings.map((r) => r.userId)));
  const users = userIds.length > 0
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, displayName: true, profile: { select: { avatarUrl: true } } },
      })
    : [];
  const uMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const adMap = Object.fromEntries(myAds.map((a) => [a.id, a]));
  const totalPages = Math.ceil(total / limit);

  const summary = myAds.reduce(
    (s, a) => ({ totalAvg: s.totalAvg + a.ratingAvg * a.ratingCount, totalCount: s.totalCount + a.ratingCount }),
    { totalAvg: 0, totalCount: 0 }
  );
  const overallAvg = summary.totalCount > 0 ? summary.totalAvg / summary.totalCount : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500" />
          我收到的評分
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          整體平均：<strong className="text-amber-500">{overallAvg.toFixed(2)}</strong> ·
          總筆數：{summary.totalCount} · 未回覆：<strong className="text-warning">{unansweredCount}</strong>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/business/ratings"
          className={`rounded border px-3 py-1.5 ${!searchParams.unanswered && !searchParams.adId ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
          全部
        </Link>
        <Link href="/business/ratings?unanswered=1"
          className={`rounded border px-3 py-1.5 ${searchParams.unanswered === "1" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
          僅未回覆 ({unansweredCount})
        </Link>
        {myAds.slice(0, 5).map((a) => (
          <Link key={a.id} href={`/business/ratings?adId=${a.id}`}
            className={`rounded border px-3 py-1.5 text-xs ${searchParams.adId === a.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {a.title.slice(0, 12)} ({a.ratingCount})
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {ratings.map((r) => {
          const u = uMap[r.userId];
          const ad = adMap[r.adId];
          return (
            <div key={r.id} className="rounded-lg border bg-card p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {u?.profile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.profile.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{u?.displayName ?? "匿名"}</p>
                    <span className="inline-flex items-center text-amber-500">
                      {Array.from({ length: r.score }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
                      ))}
                      <span className="ml-1 text-xs text-muted-foreground">{r.score}/5</span>
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{new Date(r.createdAt).toLocaleDateString("zh-TW")}</p>
                  <p className="mt-0.5">{ad?.title.slice(0, 18) ?? "—"}</p>
                </div>
              </div>

              {r.comment && (
                <p className="mt-2 rounded bg-muted/40 p-2 text-xs whitespace-pre-wrap">{r.comment}</p>
              )}

              <BusinessRatingReply
                ratingId={r.id}
                initialReply={r.merchantReply}
                initialRepliedAt={r.merchantRepliedAt?.toISOString() ?? null}
              />
            </div>
          );
        })}
        {ratings.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            無評分紀錄
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`} className="rounded border px-3 py-1">上一頁</Link>}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`} className="rounded border px-3 py-1">下一頁</Link>}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        回覆會公開顯示在廣告下方。請保持禮貌與專業；惡意攻擊或不實內容會被站方移除。
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdCard } from "@/components/listing/ad-card";
import { hasPassedAgeGate } from "@/lib/age-gate";
import { Flame } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "熱門文章 — JKForum",
  description: "JKForum 熱門店家，依瀏覽數與評分排序",
};

export default async function HotPage() {
  const session = await getServerSession(authOptions);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [forums, ads, verifiedMerchants] = await Promise.all([
    db.forum.findMany({
      where: { allowPaidListing: true, isVisible: true },
      select: { id: true, name: true, rating: true, ageGateEnabled: true },
    }),
    db.businessAd.findMany({
      where: { status: "ACTIVE" },
      orderBy: [
        { tier: "desc" },
        { viewCount: "desc" },
        { ratingAvg: "desc" },
        { favoriteCount: "desc" },
      ],
      take: 60,
    }),
    db.user.findMany({
      where: { userType: "BUSINESS", merchantVerified: true },
      select: { id: true },
    }),
  ]);

  const verifiedSet = new Set(verifiedMerchants.map((m) => m.id));
  const r18ForumIds = new Set(
    forums.filter((f) => f.rating === "R18" || f.ageGateEnabled).map((f) => f.id)
  );
  const canSeeR18 = await hasPassedAgeGate(session?.user?.id);
  const forumMap = new Map(forums.map((f) => [f.id, f]));

  const merchantIds = Array.from(new Set(ads.map((a) => a.merchantId)));
  const merchantUsers = merchantIds.length
    ? await db.user.findMany({
        where: { id: { in: merchantIds } },
        select: { id: true, username: true, displayName: true },
      })
    : [];
  const userMap = new Map(merchantUsers.map((u) => [u.id, u]));

  const toCardProps = (a: any) => {
    const u = userMap.get(a.merchantId);
    return {
      id: a.id,
      title: a.title,
      city: a.city,
      district: a.district,
      coverImageUrl: a.coverImageUrl,
      tier: a.tier,
      priceMin: a.priceMin,
      priceMax: a.priceMax,
      ratingAvg: a.ratingAvg,
      ratingCount: a.ratingCount,
      viewCount: a.viewCount,
      favoriteCount: a.favoriteCount,
      tags: (a.tags as string[]) ?? [],
      forumName: forumMap.get(a.forumId)?.name ?? "",
      merchantVerified: verifiedSet.has(a.merchantId),
      isR18: r18ForumIds.has(a.forumId),
      canSeeR18,
      author: u
        ? { id: u.id, username: u.username, name: u.displayName || u.username, image: null }
        : null,
    };
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="flex items-center gap-3">
        <Flame className="h-7 w-7 text-orange-500 sm:h-8 sm:w-8" />
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">🔥 熱門文章</h1>
          <p className="mt-0.5 text-sm font-medium text-foreground/70 sm:text-base">
            按 Tier + 瀏覽數 + 評分排序，共 {ads.length} 則
          </p>
        </div>
      </header>

      {ads.length === 0 ? (
        <div className="rounded-xl border-2 bg-card py-16 text-center">
          <p className="text-base text-foreground/70">尚無熱門店家</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {ads.map((a) => (
            <AdCard key={a.id} ad={toCardProps(a)} />
          ))}
        </div>
      )}
    </div>
  );
}

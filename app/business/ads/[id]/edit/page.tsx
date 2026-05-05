/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdEditExisting } from "@/components/business/ad-edit-existing";

export const dynamic = "force-dynamic";

export default async function EditAdPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ad = await db.businessAd.findUnique({
    where: { id: params.id },
    include: { tagAssigns: { select: { tagId: true } } },
  });
  if (!ad || ad.merchantId !== session.user.id) notFound();

  const wallet = await db.businessWallet.findUnique({ where: { merchantId: session.user.id } });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">✏️ 編輯廣告</h1>
      <AdEditExisting
        adId={ad.id}
        initial={{
          title: ad.title, description: ad.description,
          city: ad.city, district: ad.district,
          tags: (ad.tags as string[]) ?? [],
          tagIds: ad.tagAssigns.map((t) => t.tagId),
          coverImageUrl: ad.coverImageUrl ?? "",
          imageUrls: (ad.imageUrls as string[]) ?? [],
          priceMin: ad.priceMin, priceMax: ad.priceMax,
          tier: ad.tier, scheduledAt: ad.scheduledAt?.toISOString() ?? null,
        }}
        balance={wallet?.balance ?? 0}
        canEditTier={ad.status === "DRAFT" || ad.status === "REJECTED"}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MedalWall, type MedalItem } from "@/components/profile/medal-wall";
import { Trophy } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "勳章圖鑑" };

const CATEGORY_LABELS: Record<string, string> = {
  onboarding: "新手入門",
  activity: "活躍度",
  content: "內容貢獻",
  popularity: "人氣",
  quality: "品質認證",
  wealth: "財富",
  loyalty: "資歷",
  vip: "VIP",
  role: "身份",
};

export default async function MyMedalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [allMedals, owned] = await Promise.all([
    db.medal.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    db.userMedal.findMany({
      where: { userId: session.user.id },
      select: { medalId: true, awardedAt: true },
    }),
  ]);

  const ownedMap = new Map(owned.map((o) => [o.medalId, o.awardedAt]));

  // Group by category
  const grouped = allMedals.reduce<Record<string, MedalItem[]>>((acc, m) => {
    const item: MedalItem = {
      id: m.id,
      slug: m.slug,
      name: m.name,
      description: m.description,
      iconEmoji: m.iconEmoji,
      iconUrl: m.iconUrl,
      tier: m.tier,
      awardedAt: ownedMap.get(m.id) || undefined,
      owned: ownedMap.has(m.id),
    };
    (acc[m.category] = acc[m.category] || []).push(item);
    return acc;
  }, {});

  const totalOwned = owned.length;
  const totalAll = allMedals.length;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">勳章圖鑑</h1>
          <p className="text-sm text-muted-foreground">
            已獲得 <span className="font-bold text-foreground">{totalOwned}</span>
            {" / "}
            {totalAll} 枚
          </p>
        </div>
      </header>

      {Object.entries(grouped).map(([cat, items]) => (
        <MedalWall
          key={cat}
          medals={items}
          title={CATEGORY_LABELS[cat] || cat}
        />
      ))}
    </div>
  );
}

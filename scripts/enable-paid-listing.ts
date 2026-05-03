/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// 開放 paid listing 的版區 keyword
const TARGETS: { match: string; defaultTier: string; themes?: string[]; force?: boolean }[] = [
  { match: "按摩", defaultTier: "T500", themes: ["指油壓", "腳底", "全身", "理容"], force: false },
  { match: "酒店", defaultTier: "T1000", themes: ["制服", "禮服", "便服"], force: false },
  { match: "制服", defaultTier: "T1000" },
  { match: "禮服", defaultTier: "T1000" },
  { match: "養生", defaultTier: "T500" },
  { match: "女僕", defaultTier: "T500", themes: ["女僕咖啡", "主題餐廳"] },
];

async function main() {
  const forums = await db.forum.findMany({ select: { id: true, name: true, slug: true } });
  let total = 0;
  for (const t of TARGETS) {
    const matched = forums.filter((f) => f.name.includes(t.match) || f.slug.includes(t.match));
    for (const f of matched) {
      await db.forum.update({
        where: { id: f.id },
        data: {
          allowPaidListing: true,
          defaultAdTier: t.defaultTier,
          themeCategoriesJson: t.themes ?? [],
          forceThemeCategory: t.force ?? false,
        },
      });
      console.log(`✅ ${f.name} (${f.slug}) → tier=${t.defaultTier}, themes=${(t.themes ?? []).join("/") || "—"}`);
      total++;
    }
  }
  console.log(`\n共開啟 ${total} 個版區付費刊登`);
}

main().finally(() => db.$disconnect());

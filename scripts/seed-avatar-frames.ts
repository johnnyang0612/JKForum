import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const FRAMES = [
  { slug: "frame-bronze",  name: "青銅頭框",  emoji: "🥉", priceCoins: 500,   priceHearts: null, priceGems: null, rarity: "COMMON" as const,    desc: "古銅色光環邊框" },
  { slug: "frame-silver",  name: "白銀頭框",  emoji: "🥈", priceCoins: 2000,  priceHearts: null, priceGems: null, rarity: "UNCOMMON" as const,  desc: "閃亮銀色邊框" },
  { slug: "frame-gold",    name: "黃金頭框",  emoji: "🥇", priceCoins: 8000,  priceHearts: null, priceGems: null, rarity: "RARE" as const,      desc: "華麗金色光環，象徵尊貴" },
  { slug: "frame-purple",  name: "紫金尊爵",  emoji: "💜", priceCoins: null,  priceHearts: null, priceGems: 50,   rarity: "EPIC" as const,      desc: "限定寶石換購紫金邊框" },
  { slug: "frame-green",   name: "翡翠仙王",  emoji: "💚", priceCoins: null,  priceHearts: null, priceGems: 100,  rarity: "LEGENDARY" as const, desc: "傳說級翡翠光環，僅頂級玩家擁有" },
];

async function main() {
  for (const f of FRAMES) {
    await db.gameItem.upsert({
      where: { slug: f.slug },
      update: {
        name: f.name,
        description: f.desc,
        category: "RARE",
        rarity: f.rarity,
        iconEmoji: f.emoji,
        priceCoins: f.priceCoins ?? null,
        priceHearts: f.priceHearts ?? null,
        priceGems: f.priceGems ?? null,
      },
      create: {
        slug: f.slug,
        name: f.name,
        description: f.desc,
        category: "RARE",
        rarity: f.rarity,
        iconEmoji: f.emoji,
        priceCoins: f.priceCoins ?? null,
        priceHearts: f.priceHearts ?? null,
        priceGems: f.priceGems ?? null,
      },
    });
    console.log(`OK ${f.emoji} ${f.name} (${f.slug})`);
  }
}

main().then(() => db.$disconnect());

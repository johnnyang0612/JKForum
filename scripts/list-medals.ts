import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const m = await db.medal.findMany({ select: { slug: true, name: true, tier: true, category: true, iconEmoji: true }, orderBy: [{ category: "asc" }, { tier: "asc" }] });
  for (const x of m) console.log(`${x.slug} | ${x.name} | ${x.tier} | ${x.category} | ${x.iconEmoji}`);
  console.log(`\nTotal: ${m.length}`);
}
main().then(() => db.$disconnect());

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const r18 = await db.forum.findMany({ where: { rating: "R18" }, include: { category: true } });
  console.log("R-18 forums:");
  for (const f of r18) console.log(`  ${f.category.slug}/${f.slug} — ${f.name} (${f.rating})`);
  console.log(`Total ${r18.length}`);
}
main().then(()=>db.$disconnect());

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const f = await db.forum.findMany({ where: { rating: "G" }, select: { slug: true, name: true } });
  for (const x of f) console.log(`${x.slug} — ${x.name}`);
}
main().then(()=>db.$disconnect());

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const slugs = ["chitchat","feelings","entertainment","trivia","mysteries","world-news","taiwan-news","politics","mobile","hardware"];
  for (const s of slugs) {
    const f = await db.forum.findUnique({ where: { slug: s } });
    if (!f) { console.log(`${s}: NOT FOUND`); continue; }
    const c = await db.post.count({ where: { forumId: f.id, status: "PUBLISHED" } });
    console.log(`${s}: ${c} posts`);
  }
}
main().then(()=>db.$disconnect());

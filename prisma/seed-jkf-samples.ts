/**
 * Seed script: populate DB with JKF.net-style sample threads (crawled).
 * Source: E:\JKForum\research\seed-threads.json
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-jkf-samples.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// forum slug → our forum slug
const FORUM_MAP: Record<string, string> = {
  chitchat: "chitchat",
  news: "taiwan-news",
  tech: "hardware",
  travel: "travel",
  relationships: "feelings",
  sports: "basketball",
};

// crawled time string → approximate Date
function parseTimeAgo(s: string | undefined, now = new Date()): Date {
  if (!s) return new Date(now.getTime() - 86400000);
  const m = s.match(/^(\d+)\s*(分鐘|小時|天|小時前|分鐘前)/);
  if (m) {
    const n = Number(m[1]);
    const unit = m[2];
    const ms =
      unit.includes("分鐘") ? n * 60000 :
      unit.includes("小時") ? n * 3600000 :
      unit.includes("天") ? n * 86400000 : 0;
    return new Date(now.getTime() - ms);
  }
  if (s.includes("前天")) return new Date(now.getTime() - 2 * 86400000);
  if (s.includes("昨天")) return new Date(now.getTime() - 86400000);
  // absolute date pattern 2026-04-07
  const dm = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (dm) return new Date(dm[1]);
  return new Date(now.getTime() - 7 * 86400000);
}

function slugify(title: string, id: string): string {
  // Keep CJK; remove punctuation
  return (
    title
      .replace(/[\s\[\]「」『』！？。，、…《》（）()【】!?]/g, "")
      .replace(/[^\u4e00-\u9fffA-Za-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) +
    "-" +
    id.slice(-6)
  );
}

async function getOrCreateUser(displayName: string) {
  // Use displayName as both username fallback and displayName
  const username = ("user_" + displayName.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) ||
    "user_" + Math.random().toString(36).slice(2, 10)).slice(0, 30);
  const email = `${username.toLowerCase()}-jkf@example.local`;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ displayName }, { email }] },
  });
  if (existing) return existing;

  const hash = await bcrypt.hash("Seed123!Aa", 10);
  return prisma.user.create({
    data: {
      email,
      username: username || `user_${Date.now()}`,
      displayName,
      hashedPassword: hash,
      emailVerified: new Date(),
      role: "USER",
      status: "ACTIVE",
      profile: { create: {} },
      points: {
        create: {
          reputation: Math.floor(Math.random() * 1000),
          coins: Math.floor(Math.random() * 500),
          totalPoints: Math.floor(Math.random() * 1000),
          level: 15 - Math.floor(Math.random() * 5), // 平民 → 騎士
        },
      },
    },
  });
}

async function main() {
  const jsonPath = path.resolve(__dirname, "..", "..", "research", "seed-threads.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("Missing", jsonPath);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  let created = 0;
  let skipped = 0;

  for (const [srcKey, data] of Object.entries<any>(raw.forums)) {
    const ourSlug = FORUM_MAP[srcKey];
    if (!ourSlug) {
      console.log(`[skip] no mapping for ${srcKey}`);
      continue;
    }
    const forum = await prisma.forum.findUnique({ where: { slug: ourSlug } });
    if (!forum) {
      console.log(`[skip] forum not found: ${ourSlug}`);
      continue;
    }

    console.log(`\n=== ${data.name} → ${forum.name} (${forum.slug}) ===`);

    const threads = data.threads as any[];
    for (let i = 0; i < threads.length; i++) {
      const t = threads[i];
      const fullTitle = t.tag ? `[${t.tag}] ${t.title}` : t.title;
      const slug = slugify(fullTitle, `${srcKey}${i}${Date.now()}`);

      // Check duplicate by title in this forum
      const dup = await prisma.post.findFirst({
        where: { forumId: forum.id, title: fullTitle },
      });
      if (dup) {
        skipped++;
        continue;
      }

      const author = await getOrCreateUser(t.author || "匿名");
      const body = t.body || t.title;
      const excerpt = body.slice(0, 150);
      const createdAt = parseTimeAgo(t.timeAgo);

      const post = await prisma.post.create({
        data: {
          authorId: author.id,
          forumId: forum.id,
          title: fullTitle,
          content: `<p>${body.split("\n").filter(Boolean).join("</p><p>")}</p>`,
          excerpt,
          slug,
          status: "PUBLISHED",
          visibility: "PUBLIC",
          viewCount: t.viewCount || 0,
          replyCount: t.replyCount || 0,
          isFeatured: !!t.featured,
          featuredAt: t.featured ? createdAt : null,
          createdAt,
          updatedAt: createdAt,
        },
      });

      // Seed replies if present
      if (Array.isArray(t.replies)) {
        for (let ri = 0; ri < t.replies.length; ri++) {
          const r = t.replies[ri];
          const replyAuthor = await getOrCreateUser(r.author || "匿名");
          await prisma.reply.create({
            data: {
              postId: post.id,
              authorId: replyAuthor.id,
              content: r.body || "",
              likeCount: r.likes || 0,
              floor: ri + 1,
              createdAt: new Date(createdAt.getTime() + (ri + 1) * 3600000),
            },
          });
        }
      }

      created++;
      console.log(`  ✓ ${fullTitle.slice(0, 50)}`);
    }
  }

  console.log(`\n✅ Done. Created ${created} posts. Skipped ${skipped} duplicates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

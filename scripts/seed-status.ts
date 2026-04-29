import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const u = await db.user.count({ where: { email: { endsWith: "@jkforum.test" } } });
  const p = await db.post.count();
  const r = await db.reply.count();
  const m = await db.medal.count();
  const um = await db.userMedal.count();
  const cm = await db.chatMessage.count();
  const b = await db.blog.count();
  const pl = await db.poll.count();
  const f = await db.friendship.count();
  const fl = await db.userFollow.count();
  const ck = await db.checkin.count();
  const gi = await db.userGameItem.count();
  const pr = await db.postRating.count();
  const tp = await db.tip.count();
  const lk = await db.like.count();
  const fv = await db.favorite.count();
  console.log({ users:u, posts:p, replies:r, medals:m, userMedals:um, chat:cm, blogs:b, polls:pl, friends:f, follows:fl, checkins:ck, gameItems:gi, ratings:pr, tips:tp, likes:lk, favorites:fv });
}
main().then(()=>db.$disconnect());

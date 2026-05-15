/* eslint-disable */
/**
 * 給付費 Tier (≠ FREE) 的 ACTIVE 廣告補上 contact phone / line — demo 用
 * 邏輯：依 tier 給不同 sample phone + LINE ID，讓 contact modal 能顯示 tel: / line.me 兩條連結
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const CONTACTS: Record<string, { phone: string; line: string }> = {
  T500:  { phone: "0911-100-500",  line: "@jkfdemo500"  },
  T1000: { phone: "0912-100-1000", line: "@jkfdemo1000" },
  T2000: { phone: "0913-200-2000", line: "@jkfdemo2000" },
  T3000: { phone: "0914-300-3000", line: "@jkfdemo3000" },
};

async function main() {
  const ads = await db.businessAd.findMany({
    where: {
      tier: { in: ["T500", "T1000", "T2000", "T3000"] },
      status: "ACTIVE",
    },
    select: { id: true, title: true, tier: true, contactPhone: true, contactLine: true },
  });
  console.log(`Found ${ads.length} paid-Tier ACTIVE ads`);
  let touched = 0, skipped = 0;
  for (const a of ads) {
    if (a.contactPhone && a.contactLine) { skipped++; continue; }
    const c = CONTACTS[a.tier];
    if (!c) { skipped++; continue; }
    await db.businessAd.update({
      where: { id: a.id },
      data: {
        contactPhone: a.contactPhone || c.phone,
        contactLine:  a.contactLine  || c.line,
      },
    });
    touched++;
    console.log(`  ✓ ${a.tier} ${a.title.slice(0,30)} → phone=${c.phone} line=${c.line}`);
  }
  console.log(`\nDone. touched=${touched}, skipped=${skipped}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());

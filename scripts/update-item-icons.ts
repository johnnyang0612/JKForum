import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
const db = new PrismaClient();

async function main() {
  const dir = "./public/icons/items";
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".svg"));
  let updated = 0;
  for (const f of files) {
    const slug = f.replace(".svg", "");
    const url = `/icons/items/${f}`;
    const r = await db.gameItem.updateMany({
      where: { slug },
      data: { iconUrl: url },
    });
    if (r.count > 0) {
      console.log(`OK ${slug} -> ${url}`);
      updated++;
    } else {
      console.warn(`SKIP ${slug} (no item with this slug)`);
    }
  }
  console.log(`\n${updated} 個 GameItem 更新了 iconUrl`);
}
main().then(() => db.$disconnect());

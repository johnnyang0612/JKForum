import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
const db = new PrismaClient();

async function main() {
  const dir = "./public/icons/medals";
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".svg"));
  let updated = 0;
  for (const f of files) {
    const slug = f.replace(".svg", "");
    const url = `/icons/medals/${f}`;
    const r = await db.medal.updateMany({
      where: { slug },
      data: { iconUrl: url },
    });
    if (r.count > 0) {
      updated++;
    } else {
      console.warn(`SKIP ${slug}`);
    }
  }
  console.log(`${updated} 個 Medal 更新了 iconUrl`);
}
main().then(() => db.$disconnect());

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  await db.platformSetting.upsert({
    where: { key: "r18_enabled" },
    update: { value: true },
    create: { key: "r18_enabled", value: true },
  });
  console.log("✅ R-18 enabled platform-wide");
}
main().then(()=>db.$disconnect());

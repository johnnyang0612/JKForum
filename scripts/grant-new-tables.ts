// One-shot: GRANT new tables to jkforum_app after prisma db push
import { runAsAdmin } from "../lib/db-admin";

async function main() {
  await runAsAdmin(async (c) => {
    const tables = ["announcements", "account_deletion_requests"];
    for (const t of tables) {
      try {
        await c.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${t} TO jkforum_app`);
        console.log(`✓ granted ${t}`);
      } catch (e) {
        console.warn(`! skip ${t}:`, (e as Error).message);
      }
    }
  });
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

/* eslint-disable no-console */
/**
 * Migration: forum_advanced_filters_and_pin_cap
 * - forums.advanced_filters_json  (JSONB, default '[]')
 * - forums.max_pinned_posts       (INT, default 2)
 *
 * 跑法：
 *   npx tsx scripts/migrate-forum-advanced-filters.ts
 */
import { runAsAdmin } from "../lib/db-admin";

const STMTS = [
  `ALTER TABLE forums
     ADD COLUMN IF NOT EXISTS advanced_filters_json JSONB NOT NULL DEFAULT '[]'::jsonb;`,
  `ALTER TABLE forums
     ADD COLUMN IF NOT EXISTS max_pinned_posts INT NOT NULL DEFAULT 2;`,
  // 確保 GRANT 給應用 role
  `GRANT SELECT, INSERT, UPDATE, DELETE ON forums TO jkforum_app;`,
];

async function main() {
  await runAsAdmin(async (c) => {
    for (const sql of STMTS) {
      const label = sql.split("\n")[0].slice(0, 80);
      try {
        await c.query(sql);
        console.log("✅", label);
      } catch (e) {
        console.error("❌", label, e);
        throw e;
      }
    }
  });
  console.log("\n🎉 Migration done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

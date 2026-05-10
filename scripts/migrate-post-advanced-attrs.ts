/* eslint-disable no-console */
/**
 * Migration: posts.advanced_attrs JSONB
 * 跑法：npx tsx scripts/migrate-post-advanced-attrs.ts
 */
import { runAsAdmin } from "../lib/db-admin";

const STMTS = [
  `ALTER TABLE posts
     ADD COLUMN IF NOT EXISTS advanced_attrs JSONB NOT NULL DEFAULT '{}'::jsonb;`,
  `CREATE INDEX IF NOT EXISTS posts_advanced_attrs_gin
     ON posts USING GIN (advanced_attrs);`,
  `GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO jkforum_app;`,
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
  console.log("\n🎉 posts.advanced_attrs migration done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

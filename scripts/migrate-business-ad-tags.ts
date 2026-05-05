/* eslint-disable no-console */
/**
 * Migration: business_ad_tags
 * - business_ad_tags  : 後台管理的標籤字典
 * - business_ad_tag_assigns : BusinessAd ↔ BusinessAdTag 多對多關聯
 *
 * 跑法：
 *   npx tsx scripts/migrate-business-ad-tags.ts
 */
import { runAsAdmin } from "../lib/db-admin";

const STMTS = [
  // business_ad_tags
  `CREATE TABLE IF NOT EXISTS business_ad_tags (
     id TEXT PRIMARY KEY,
     name VARCHAR(40) NOT NULL UNIQUE,
     slug VARCHAR(60) NOT NULL UNIQUE,
     category VARCHAR(40),
     sort_order INT NOT NULL DEFAULT 0,
     is_active BOOLEAN NOT NULL DEFAULT true,
     is_unlimited BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE INDEX IF NOT EXISTS bat_active_cat_sort_idx
     ON business_ad_tags(is_active, category, sort_order);`,

  // business_ad_tag_assigns
  `CREATE TABLE IF NOT EXISTS business_ad_tag_assigns (
     id TEXT PRIMARY KEY,
     ad_id TEXT NOT NULL,
     tag_id TEXT NOT NULL,
     assigned_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT bata_ad_tag_uq UNIQUE(ad_id, tag_id),
     CONSTRAINT bata_ad_fk FOREIGN KEY (ad_id) REFERENCES business_ads(id) ON DELETE CASCADE,
     CONSTRAINT bata_tag_fk FOREIGN KEY (tag_id) REFERENCES business_ad_tags(id) ON DELETE CASCADE
   );`,
  `CREATE INDEX IF NOT EXISTS bata_tag_idx ON business_ad_tag_assigns(tag_id);`,

  // GRANTS
  `GRANT SELECT, INSERT, UPDATE, DELETE ON
     business_ad_tags, business_ad_tag_assigns
   TO jkforum_app;`,
];

async function main() {
  await runAsAdmin(async (c) => {
    for (let i = 0; i < STMTS.length; i++) {
      const sql = STMTS[i];
      const head = sql.replace(/\s+/g, " ").slice(0, 100);
      console.log(`[${i + 1}/${STMTS.length}] ${head}...`);
      await c.query(sql);
    }
  });
  console.log("\n✅ business_ad_tags migration complete");
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});

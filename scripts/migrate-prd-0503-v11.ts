/* eslint-disable no-console */
/**
 * V1.1 Migration:
 * - Blog: hot_score, status (DRAFT/PUBLISHED), updatedAt 已有
 * - business_ad_comments
 * - banned_words
 * - search_logs
 * - coupon_codes / coupon_redemptions
 * - business_ads: scheduled_at
 * - user_activities (簡化行為追蹤)
 */
import { runAsAdmin } from "../lib/db-admin";

const STMTS = [
  // Blog 增 hot_score + status
  `DO $$ BEGIN
     CREATE TYPE "BlogStatus" AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `ALTER TABLE blogs
     ADD COLUMN IF NOT EXISTS status "BlogStatus" NOT NULL DEFAULT 'PUBLISHED',
     ADD COLUMN IF NOT EXISTS hot_score DOUBLE PRECISION NOT NULL DEFAULT 0,
     ADD COLUMN IF NOT EXISTS has_video BOOLEAN NOT NULL DEFAULT false;`,
  `CREATE INDEX IF NOT EXISTS blogs_status_hot_idx ON blogs(status, hot_score);`,

  // business_ads scheduled_at
  `ALTER TABLE business_ads
     ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP(3);`,

  // business_ad_comments
  `CREATE TABLE IF NOT EXISTS business_ad_comments (
     id TEXT PRIMARY KEY,
     ad_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     content TEXT NOT NULL,
     parent_id TEXT,
     is_deleted BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE INDEX IF NOT EXISTS bac_ad_created_idx ON business_ad_comments(ad_id, created_at);`,

  // banned_words
  `CREATE TABLE IF NOT EXISTS banned_words (
     id SERIAL PRIMARY KEY,
     word VARCHAR(50) NOT NULL UNIQUE,
     severity VARCHAR(10) NOT NULL DEFAULT 'BLOCK',
     category VARCHAR(30),
     created_by TEXT,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE INDEX IF NOT EXISTS bw_severity_idx ON banned_words(severity);`,

  // search_logs
  `CREATE TABLE IF NOT EXISTS search_logs (
     id BIGSERIAL PRIMARY KEY,
     query VARCHAR(120) NOT NULL,
     user_id TEXT,
     scope VARCHAR(20) NOT NULL DEFAULT 'listing',
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE INDEX IF NOT EXISTS sl_query_idx ON search_logs(query);`,
  `CREATE INDEX IF NOT EXISTS sl_created_idx ON search_logs(created_at);`,

  // coupon_codes
  `DO $$ BEGIN
     CREATE TYPE "CouponType" AS ENUM ('PERCENT','FIXED','BONUS');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS coupon_codes (
     id TEXT PRIMARY KEY,
     code VARCHAR(20) NOT NULL UNIQUE,
     type "CouponType" NOT NULL,
     value INT NOT NULL,
     min_amount INT NOT NULL DEFAULT 0,
     max_uses INT,
     used_count INT NOT NULL DEFAULT 0,
     expires_at TIMESTAMP(3),
     is_active BOOLEAN NOT NULL DEFAULT true,
     description TEXT,
     created_by TEXT,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE TABLE IF NOT EXISTS coupon_redemptions (
     id TEXT PRIMARY KEY,
     coupon_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     amount INT NOT NULL,
     bonus INT NOT NULL DEFAULT 0,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT cr_coupon_user_uq UNIQUE(coupon_id, user_id)
   );`,
  `CREATE INDEX IF NOT EXISTS cr_user_idx ON coupon_redemptions(user_id);`,

  // user_activities (行為追蹤)
  `CREATE TABLE IF NOT EXISTS user_activities (
     id BIGSERIAL PRIMARY KEY,
     user_id TEXT NOT NULL,
     action VARCHAR(40) NOT NULL,
     target_type VARCHAR(30),
     target_id TEXT,
     metadata JSONB,
     ip VARCHAR(45),
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE INDEX IF NOT EXISTS ua_user_created_idx ON user_activities(user_id, created_at);`,
  `CREATE INDEX IF NOT EXISTS ua_action_created_idx ON user_activities(action, created_at);`,

  // GRANTS
  `GRANT SELECT, INSERT, UPDATE, DELETE ON
     business_ad_comments, banned_words, search_logs,
     coupon_codes, coupon_redemptions, user_activities
   TO jkforum_app;`,
  `GRANT USAGE, SELECT ON SEQUENCE banned_words_id_seq TO jkforum_app;`,
  `GRANT USAGE, SELECT ON SEQUENCE search_logs_id_seq TO jkforum_app;`,
  `GRANT USAGE, SELECT ON SEQUENCE user_activities_id_seq TO jkforum_app;`,
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
  console.log("\n✅ V1.1 migration complete");
}

main().catch((e) => { console.error("❌", e); process.exit(1); });

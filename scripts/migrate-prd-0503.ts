/* eslint-disable no-console */
/**
 * PRD-0503 Migration:
 * 1. ALTER users: userType, merchantName, merchantBio, merchantVerified, merchantVerifiedDocs
 * 2. ALTER forums: allow_paid_listing, default_ad_tier, theme_categories_json, force_theme_category
 * 3. CREATE business_ads, business_wallets, business_wallet_tx, withdrawal_requests, regions, blog_store_links, business_ad_favorites
 * 4. GRANT all to jkforum_app
 */
import { runAsAdmin } from "../lib/db-admin";

const STMTS = [
  // ENUMs (skip if exists)
  `DO $$ BEGIN
     CREATE TYPE "UserType" AS ENUM ('MEMBER', 'BUSINESS');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "BusinessAdStatus" AS ENUM ('DRAFT','PENDING','ACTIVE','REJECTED','EXPIRED','TAKEN_DOWN','REMOVED');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "AdTier" AS ENUM ('FREE','T500','T1000','T2000','T3000');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING','APPROVED','REJECTED','PAID');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "WalletTxType" AS ENUM ('DEPOSIT','AD_PAYMENT','REFUND','WITHDRAWAL','ADMIN_ADJUST');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  // ALTER users
  `ALTER TABLE users
     ADD COLUMN IF NOT EXISTS user_type "UserType" NOT NULL DEFAULT 'MEMBER',
     ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(60),
     ADD COLUMN IF NOT EXISTS merchant_bio TEXT,
     ADD COLUMN IF NOT EXISTS merchant_verified BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS merchant_verified_docs JSONB NOT NULL DEFAULT '[]'::jsonb;`,

  // ALTER forums
  `ALTER TABLE forums
     ADD COLUMN IF NOT EXISTS allow_paid_listing BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS default_ad_tier TEXT,
     ADD COLUMN IF NOT EXISTS theme_categories_json JSONB NOT NULL DEFAULT '[]'::jsonb,
     ADD COLUMN IF NOT EXISTS force_theme_category BOOLEAN NOT NULL DEFAULT false;`,

  // business_ads
  `CREATE TABLE IF NOT EXISTS business_ads (
     id TEXT PRIMARY KEY,
     merchant_id TEXT NOT NULL,
     forum_id TEXT NOT NULL,
     title VARCHAR(150) NOT NULL,
     description TEXT NOT NULL,
     city VARCHAR(20) NOT NULL,
     district VARCHAR(20) NOT NULL,
     tags JSONB NOT NULL DEFAULT '[]'::jsonb,
     cover_image_url TEXT,
     image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
     price_min INT,
     price_max INT,
     rating_avg DOUBLE PRECISION NOT NULL DEFAULT 0,
     rating_count INT NOT NULL DEFAULT 0,
     tier "AdTier" NOT NULL DEFAULT 'FREE',
     tier_amount_twd INT NOT NULL DEFAULT 0,
     status "BusinessAdStatus" NOT NULL DEFAULT 'DRAFT',
     published_at TIMESTAMP(3),
     expires_at TIMESTAMP(3),
     reject_reason TEXT,
     view_count INT NOT NULL DEFAULT 0,
     click_count INT NOT NULL DEFAULT 0,
     favorite_count INT NOT NULL DEFAULT 0,
     contact_count INT NOT NULL DEFAULT 0,
     sort_weight DOUBLE PRECISION NOT NULL DEFAULT 0,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE INDEX IF NOT EXISTS business_ads_forum_status_sort_idx ON business_ads(forum_id, status, sort_weight);`,
  `CREATE INDEX IF NOT EXISTS business_ads_merchant_status_idx ON business_ads(merchant_id, status);`,
  `CREATE INDEX IF NOT EXISTS business_ads_city_district_status_idx ON business_ads(city, district, status);`,
  `CREATE INDEX IF NOT EXISTS business_ads_status_expires_idx ON business_ads(status, expires_at);`,

  // business_wallets
  `CREATE TABLE IF NOT EXISTS business_wallets (
     id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     merchant_id TEXT NOT NULL UNIQUE,
     balance INT NOT NULL DEFAULT 0,
     total_deposit INT NOT NULL DEFAULT 0,
     total_spent INT NOT NULL DEFAULT 0,
     total_withdraw INT NOT NULL DEFAULT 0,
     updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,

  // business_wallet_tx
  `CREATE TABLE IF NOT EXISTS business_wallet_tx (
     id TEXT PRIMARY KEY,
     merchant_id TEXT NOT NULL,
     type "WalletTxType" NOT NULL,
     amount INT NOT NULL,
     balance INT NOT NULL,
     related_id TEXT,
     note TEXT,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE INDEX IF NOT EXISTS bwt_merchant_created_idx ON business_wallet_tx(merchant_id, created_at);`,

  // withdrawal_requests
  `CREATE TABLE IF NOT EXISTS withdrawal_requests (
     id TEXT PRIMARY KEY,
     merchant_id TEXT NOT NULL,
     amount INT NOT NULL,
     bank_code VARCHAR(10) NOT NULL,
     bank_account VARCHAR(30) NOT NULL,
     bank_account_name VARCHAR(50) NOT NULL,
     status "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
     reject_reason TEXT,
     reviewed_by TEXT,
     reviewed_at TIMESTAMP(3),
     paid_at TIMESTAMP(3),
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE INDEX IF NOT EXISTS wr_merchant_status_idx ON withdrawal_requests(merchant_id, status);`,
  `CREATE INDEX IF NOT EXISTS wr_status_created_idx ON withdrawal_requests(status, created_at);`,

  // regions
  `CREATE TABLE IF NOT EXISTS regions (
     id SERIAL PRIMARY KEY,
     city VARCHAR(20) NOT NULL,
     district VARCHAR(20) NOT NULL,
     sort_order INT NOT NULL DEFAULT 0,
     is_active BOOLEAN NOT NULL DEFAULT true,
     CONSTRAINT regions_city_district_uq UNIQUE(city, district)
   );`,
  `CREATE INDEX IF NOT EXISTS regions_city_sort_idx ON regions(city, sort_order);`,

  // blog_store_links
  `CREATE TABLE IF NOT EXISTS blog_store_links (
     id TEXT PRIMARY KEY,
     blog_id TEXT NOT NULL UNIQUE,
     ad_id TEXT NOT NULL,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE INDEX IF NOT EXISTS bsl_ad_idx ON blog_store_links(ad_id);`,

  // business_ad_favorites
  `CREATE TABLE IF NOT EXISTS business_ad_favorites (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     ad_id TEXT NOT NULL,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT baf_user_ad_uq UNIQUE(user_id, ad_id)
   );`,
  `CREATE INDEX IF NOT EXISTS baf_user_created_idx ON business_ad_favorites(user_id, created_at);`,

  // GRANTS
  `GRANT SELECT, INSERT, UPDATE, DELETE ON
     business_ads, business_wallets, business_wallet_tx, withdrawal_requests,
     regions, blog_store_links, business_ad_favorites
   TO jkforum_app;`,
  `GRANT USAGE ON SEQUENCE regions_id_seq TO jkforum_app;`,
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
  console.log("\n✅ PRD-0503 migration complete");
}

main().catch((e) => { console.error("❌ Migration failed:", e); process.exit(1); });

// Add new BusinessAd columns: contentHtml, videoUrls, contactPhone, contactLine
// Run as postgres admin (super user) since jkforum_app cannot ALTER tables it doesn't own.
//
// Usage:  node scripts/migrate-business-ad-extensions.js
const { Client } = require("pg");

const client = new Client({
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.srfsofbjdzcqcgedpagh",
  password: "3ovk77uxEPDZTCSG",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const statements = [
  // 富文本長介紹
  `ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS content_html TEXT`,
  // 影音 URL 陣列
  `ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS video_urls JSONB NOT NULL DEFAULT '[]'::jsonb`,
  // 聯絡資訊（僅付費 tier 寫入）
  `ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(40)`,
  `ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS contact_line VARCHAR(60)`,
];

(async () => {
  await client.connect();
  console.log("Connected as postgres admin");
  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log("OK  ", sql);
    } catch (e) {
      console.error("FAIL", sql, "\n     ", e.message);
    }
  }
  await client.end();
  console.log("Done.");
})();

// Add sort_order column to business_ad_favorites
// Run as postgres admin.
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
  `ALTER TABLE business_ad_favorites ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0`,
  `CREATE INDEX IF NOT EXISTS business_ad_favorites_user_id_sort_order_idx ON business_ad_favorites(user_id, sort_order)`,
];

(async () => {
  await client.connect();
  console.log("Connected as postgres admin");
  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log("  ✓", sql.slice(0, 80));
    } catch (e) {
      console.error("  ✗", sql.slice(0, 80), "-", e.message);
    }
  }
  await client.end();
  console.log("Done.");
})();

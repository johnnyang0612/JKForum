import { runAsAdmin } from "../lib/db-admin";

runAsAdmin(async (c) => {
  await c.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON business_ad_ratings TO jkforum_app`);
  console.log("✓ granted business_ad_ratings");
}).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

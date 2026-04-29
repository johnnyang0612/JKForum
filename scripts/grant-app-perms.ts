/**
 * Grant SELECT/INSERT/UPDATE/DELETE on all newly created tables/sequences
 * to the jkforum_app role. Run after every `prisma db push` that adds tables.
 */
import { runAsAdmin } from "../lib/db-admin";

async function main() {
  await runAsAdmin(async (c) => {
    const sql = `
      GRANT USAGE ON SCHEMA public TO jkforum_app;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO jkforum_app;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO jkforum_app;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO jkforum_app;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO jkforum_app;
    `;
    await c.query(sql);
    console.log("✅ Granted app perms on all public tables/sequences");
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

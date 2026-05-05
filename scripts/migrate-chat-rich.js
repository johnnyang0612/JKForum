/* eslint-disable */
// 跑 chat_messages_rich migration — 用 postgres super user
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const SQL_PATH = path.join(
  __dirname,
  "..",
  "prisma",
  "migrations",
  "20260505_chat_messages_rich",
  "migration.sql"
);

(async () => {
  const sql = fs.readFileSync(SQL_PATH, "utf8");
  const c = new Client({
    host: "aws-1-ap-northeast-1.pooler.supabase.com",
    port: 5432,
    user: "postgres.srfsofbjdzcqcgedpagh",
    password: "3ovk77uxEPDZTCSG",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  console.log("[migrate] connected as postgres admin");
  try {
    await c.query("BEGIN");
    await c.query(sql);
    // 補 GRANT — 讓 jkforum_app 能讀寫新表
    await c.query(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON chat_room_reads, chat_moderation_logs TO jkforum_app"
    );
    await c.query("COMMIT");
    console.log("[migrate] ✅ chat_messages_rich applied");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("[migrate] ❌", e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})();

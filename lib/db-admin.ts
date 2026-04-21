/**
 * DB admin client for DDL operations (CREATE TABLE, ALTER, GRANT, etc).
 * Uses the postgres superuser password, NOT the regular jkforum_app role.
 *
 * ⚠️ DO NOT import this from server-side route handlers in production runtime.
 * Only for migrations / seeds / admin tools.
 */
import { Client } from "pg";

const POSTGRES_ADMIN_URL =
  process.env.POSTGRES_ADMIN_URL ||
  "postgresql://postgres.srfsofbjdzcqcgedpagh:3ovk77uxEPDZTCSG@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

export async function runAsAdmin<T>(
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client({
    connectionString: POSTGRES_ADMIN_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function runSqlAsAdmin(sql: string, params: unknown[] = []) {
  return runAsAdmin(async (c) => c.query(sql, params));
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query = String(body.query ?? "").trim().slice(0, 120);
  if (!query) return NextResponse.json({ success: false });
  const session = await getServerSession(authOptions);
  await db.searchLog.create({
    data: { query, userId: session?.user?.id ?? null, scope: "listing" },
  }).catch(() => null);
  return NextResponse.json({ success: true });
}

// 查 top 10 hot keywords (近 7 天)
export async function GET() {
  const since = new Date(Date.now() - 7 * 86400000);
  const rows = await db.$queryRaw<Array<{ query: string; cnt: bigint }>>`
    SELECT query, COUNT(*)::bigint AS cnt
    FROM search_logs
    WHERE created_at >= ${since}
    GROUP BY query
    ORDER BY cnt DESC
    LIMIT 10
  `;
  return NextResponse.json({
    success: true,
    keywords: rows.map((r) => ({ query: r.query, count: Number(r.cnt) })),
  });
}

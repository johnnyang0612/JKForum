import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return null;
  }
  return session.user;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }
  const settings = await db.platformSetting.findMany();
  const map: Record<string, unknown> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json(map);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  for (const [key, value] of Object.entries(body)) {
    await db.platformSetting.upsert({
      where: { key },
      create: { key, value: value as object },
      update: { value: value as object, updatedAt: new Date() },
    });
  }
  return NextResponse.json({ success: true });
}

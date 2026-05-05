/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin: 業者刊登標籤字典 — 列表 / 新增
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-log";

export const dynamic = "force-dynamic";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

function makeSlug(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[\s　]+/g, "-")
    .replace(/[^\w\-.()]/g, "");
  if (ascii && /^[a-z0-9\-.()]+$/i.test(ascii)) {
    return `bat-${ascii}`.slice(0, 60);
  }
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h) ^ name.charCodeAt(i);
  return `bat-${(h >>> 0).toString(36)}-${name.length}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role as any)) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const tags = await db.businessAdTag.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ success: true, tags });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role as any)) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 40);
  const category = body.category ? String(body.category).trim().slice(0, 40) : null;
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Math.floor(Number(body.sortOrder)) : 0;
  const isActive = body.isActive === false ? false : true;
  const isUnlimited = !!body.isUnlimited;

  if (!name) {
    return NextResponse.json({ success: false, error: "標籤名稱必填" }, { status: 400 });
  }

  const slug = body.slug ? String(body.slug).trim().slice(0, 60) : makeSlug(name);

  try {
    const tag = await db.businessAdTag.create({
      data: { name, slug, category, sortOrder, isActive, isUnlimited },
    });
    await logAdminAction({
      adminId: session.user.id,
      action: "SETTINGS_CHANGE",
      targetType: "BusinessAdTag",
      targetId: tag.id,
      detail: `新增業者標籤 ${name}`,
    });
    return NextResponse.json({ success: true, tag });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "標籤名稱或 slug 已存在" },
        { status: 400 },
      );
    }
    throw e;
  }
}

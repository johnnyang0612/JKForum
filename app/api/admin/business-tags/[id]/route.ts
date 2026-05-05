/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin: 業者刊登標籤 — 編輯 / 刪除（軟刪除：isActive=false）
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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role as any)) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const tag = await db.businessAdTag.findUnique({ where: { id: params.id } });
  if (!tag) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.name === "string") data.name = body.name.trim().slice(0, 40);
  if (body.category === null) data.category = null;
  else if (typeof body.category === "string") data.category = body.category.trim().slice(0, 40) || null;
  if (typeof body.slug === "string") data.slug = body.slug.trim().slice(0, 60);
  if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
    data.sortOrder = Math.floor(Number(body.sortOrder));
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.isUnlimited === "boolean") data.isUnlimited = body.isUnlimited;

  try {
    const updated = await db.businessAdTag.update({ where: { id: tag.id }, data });
    await logAdminAction({
      adminId: session.user.id,
      action: "SETTINGS_CHANGE",
      targetType: "BusinessAdTag",
      targetId: tag.id,
      detail: `編輯業者標籤 ${updated.name}`,
    });
    return NextResponse.json({ success: true, tag: updated });
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

// DELETE：軟刪除（isActive=false）。如果帶 ?hard=1 則硬刪
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role as any)) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const url = new URL(req.url);
  const hard = url.searchParams.get("hard") === "1";

  const tag = await db.businessAdTag.findUnique({ where: { id: params.id } });
  if (!tag) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });

  if (hard) {
    await db.businessAdTag.delete({ where: { id: tag.id } });
    await logAdminAction({
      adminId: session.user.id,
      action: "SETTINGS_CHANGE",
      targetType: "BusinessAdTag",
      targetId: tag.id,
      detail: `硬刪除業者標籤 ${tag.name}`,
    });
  } else {
    await db.businessAdTag.update({
      where: { id: tag.id },
      data: { isActive: false },
    });
    await logAdminAction({
      adminId: session.user.id,
      action: "SETTINGS_CHANGE",
      targetType: "BusinessAdTag",
      targetId: tag.id,
      detail: `停用業者標籤 ${tag.name}`,
    });
  }
  return NextResponse.json({ success: true });
}

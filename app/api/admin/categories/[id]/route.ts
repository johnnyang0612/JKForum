import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 100);
  if (typeof body.slug === "string") {
    const s = body.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,50}$/.test(s)) return NextResponse.json({ error: "代稱格式錯誤" }, { status: 400 });
    data.slug = s;
  }
  if (typeof body.iconEmoji !== "undefined") data.iconEmoji = body.iconEmoji ? String(body.iconEmoji).slice(0, 4) : null;
  if (typeof body.description !== "undefined") data.description = body.description ? String(body.description).slice(0, 500) : null;
  if (["G", "PG13", "R18"].includes(body.rating)) data.rating = body.rating;
  if (typeof body.isVisible === "boolean") data.isVisible = body.isVisible;
  if (typeof body.isEnabled === "boolean") data.isEnabled = body.isEnabled;
  if (Number.isFinite(Number(body.sortOrder))) data.sortOrder = Number(body.sortOrder);

  try {
    const cat = await db.category.update({ where: { id: ctx.params.id }, data });
    await logAdminAction({
      adminId: admin.id,
      action: "SETTINGS_CHANGE",
      targetType: "Category",
      targetId: cat.id,
      detail: `[CATEGORY_UPDATE] ${cat.name}`,
    });
    revalidatePath("/admin/categories");
    revalidatePath("/forums");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "更新失敗（代稱可能重複）" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  // 必須先把所有看板移走
  const count = await db.forum.count({ where: { categoryId: ctx.params.id } });
  if (count > 0) {
    return NextResponse.json({ error: `此分類下還有 ${count} 個看板` }, { status: 400 });
  }

  try {
    await db.category.delete({ where: { id: ctx.params.id } });
    await logAdminAction({
      adminId: admin.id,
      action: "SETTINGS_CHANGE",
      targetType: "Category",
      targetId: ctx.params.id,
      detail: `[CATEGORY_DELETE]`,
    });
    revalidatePath("/admin/categories");
    revalidatePath("/forums");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "刪除失敗" }, { status: 400 });
  }
}

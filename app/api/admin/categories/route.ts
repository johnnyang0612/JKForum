import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const rating = ["G", "PG13", "R18"].includes(body.rating) ? body.rating : "G";
  const iconEmoji = body.iconEmoji ? String(body.iconEmoji).slice(0, 4) : null;
  const description = body.description ? String(body.description).slice(0, 500) : null;
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

  if (!name || name.length > 100) return NextResponse.json({ error: "名稱不正確" }, { status: 400 });
  if (!/^[a-z0-9-]{2,50}$/.test(slug)) {
    return NextResponse.json({ error: "代稱只能英數小寫與 -，2-50 字元" }, { status: 400 });
  }

  const exists = await db.category.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "代稱已被使用" }, { status: 400 });

  const cat = await db.category.create({
    data: { name, slug, rating, iconEmoji, description, sortOrder },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "SETTINGS_CHANGE",
    targetType: "Category",
    targetId: cat.id,
    detail: `[CATEGORY_CREATE] ${name}`,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/forums");

  return NextResponse.json({
    data: {
      id: cat.id, name: cat.name, slug: cat.slug, description: cat.description,
      iconEmoji: cat.iconEmoji, rating: cat.rating, isVisible: cat.isVisible,
      isEnabled: cat.isEnabled, sortOrder: cat.sortOrder, forumCount: 0,
    },
  });
}

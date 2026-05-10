import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.filter((x: unknown) => typeof x === "string")
    : [];
  if (ids.length === 0) return NextResponse.json({ error: "未選 tag" }, { status: 400 });

  // Cascade 會自動清 PostTag 關聯
  const result = await db.tag.deleteMany({ where: { id: { in: ids } } });

  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "Tag", targetId: ids.join(","),
    detail: `[TAG_BULK_DELETE] ${result.count} 個`,
  });

  revalidatePath("/admin/tags");
  revalidatePath("/search");

  return NextResponse.json({ ok: true, deleted: result.count });
}

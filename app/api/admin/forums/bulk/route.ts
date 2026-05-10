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
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "未選擇看板" }, { status: 400 });
  if (ids.length > 200) return NextResponse.json({ error: "單次最多 200 板" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.isVisible === "boolean") data.isVisible = body.isVisible;
  if (typeof body.isLocked === "boolean") data.isLocked = body.isLocked;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "未指定欲變更欄位" }, { status: 400 });
  }

  const result = await db.forum.updateMany({
    where: { id: { in: ids } },
    data,
  });

  await logAdminAction({
    adminId: admin.id,
    action: "SETTINGS_CHANGE",
    targetType: "Forum",
    targetId: ids.join(","),
    detail: `[FORUM_BULK_UPDATE] ${result.count} 板：${JSON.stringify(data)}`,
  });

  revalidatePath("/admin/forums");
  revalidatePath("/forums");

  return NextResponse.json({ ok: true, updated: result.count });
}

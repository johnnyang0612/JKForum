import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const form = await req.formData();
  const userId = String(form.get("userId") ?? "");
  if (!userId) return NextResponse.redirect(new URL("/admin/checkin", req.url));

  const result = await db.checkin.deleteMany({ where: { userId } });
  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "User", targetId: userId,
    detail: `[CHECKIN_RESET] 重置 ${result.count} 筆簽到`,
  });
  revalidatePath("/admin/checkin");

  return NextResponse.redirect(new URL(`/admin/checkin?userId=${userId}`, req.url));
}

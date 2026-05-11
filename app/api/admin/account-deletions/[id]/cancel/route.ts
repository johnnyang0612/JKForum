import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const r = await db.accountDeletionRequest.findUnique({ where: { id: params.id } });
  if (!r) return NextResponse.redirect(new URL("/admin/account-deletions", req.url));
  if (r.executedAt) return NextResponse.redirect(new URL("/admin/account-deletions?status=executed", req.url));

  await db.accountDeletionRequest.update({
    where: { id: params.id },
    data: { cancelledAt: new Date() },
  });
  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "AccountDeletionRequest", targetId: params.id,
    detail: `[ACCOUNT_DELETE_CANCEL] 替 user ${r.userId} 取消刪除申請`,
  });
  revalidatePath("/admin/account-deletions");
  return NextResponse.redirect(new URL("/admin/account-deletions", req.url));
}

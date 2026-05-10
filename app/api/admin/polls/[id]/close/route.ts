import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL("/admin", _req.url));
  }

  await db.poll.update({
    where: { id: params.id },
    data: { closesAt: new Date() },
  });
  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "Poll", targetId: params.id, detail: "[POLL_CLOSE]",
  });

  revalidatePath("/admin/polls");
  return NextResponse.redirect(new URL("/admin/polls", _req.url));
}

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

  // BlogStatus 沒有 DELETED；用 ARCHIVED 表示下架；前台 query 會以 PUBLISHED 為主
  await db.blog.update({
    where: { id: params.id },
    data: { status: "ARCHIVED", isPublic: false },
  });
  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "Blog", targetId: params.id, detail: "[BLOG_DELETE]",
  });

  revalidatePath("/admin/blogs");
  revalidatePath("/blog");
  return NextResponse.redirect(new URL("/admin/blogs", _req.url));
}

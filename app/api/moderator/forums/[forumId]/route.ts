import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: { forumId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) {
    const isMod = await db.forumModerator.findUnique({
      where: { forumId_userId: { forumId: ctx.params.forumId, userId: session.user.id } },
    });
    if (!isMod) return NextResponse.json({ error: "非該版版主" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.rules === "string") data.rules = body.rules.slice(0, 5000);
  if (typeof body.isLocked === "boolean") data.isLocked = body.isLocked;
  if (Number.isFinite(Number(body.maxPinnedPosts))) {
    const n = Number(body.maxPinnedPosts);
    if (n >= 0 && n <= 10) data.maxPinnedPosts = n;
  }
  if (typeof body.themeCategoriesRaw === "string") {
    data.themeCategoriesJson = body.themeCategoriesRaw
      .split(/[,，\s]+/).map((s: string) => s.trim()).filter(Boolean).slice(0, 20);
  }
  if (typeof body.forceThemeCategory === "boolean") {
    data.forceThemeCategory = body.forceThemeCategory;
  }
  if (typeof body.advancedFiltersRaw === "string") {
    try {
      const parsed = JSON.parse(body.advancedFiltersRaw || "[]");
      if (!Array.isArray(parsed)) {
        return NextResponse.json({ error: "advancedFilters 必須是 array" }, { status: 400 });
      }
      // 簡單形狀驗證
      for (const f of parsed) {
        if (!f.key || !f.label || !["select", "multiselect", "range"].includes(f.type)) {
          return NextResponse.json({ error: "filter 缺欄位 key/label/type 或 type 不正確" }, { status: 400 });
        }
      }
      data.advancedFiltersJson = parsed;
    } catch (e) {
      return NextResponse.json({ error: `JSON 格式錯誤：${(e as Error).message}` }, { status: 400 });
    }
  }

  try {
    const forum = await db.forum.update({ where: { id: ctx.params.forumId }, data });
    // 寫到 admin log
    await db.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "FORUM_EDIT",
        targetType: "Forum",
        targetId: forum.id,
        detail: `[MODERATOR_EDIT] ${forum.name}：${Object.keys(data).join(",")}`,
      },
    }).catch(() => null);

    revalidatePath("/moderator");
    revalidatePath("/forums");
    revalidatePath(`/forums/${forum.slug}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "更新失敗" }, { status: 400 });
  }
}

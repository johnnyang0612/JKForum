import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 50) || "tag";
}

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
  const targetName = String(body.targetName ?? "").trim();
  if (!targetName) return NextResponse.json({ error: "目標名稱必填" }, { status: 400 });
  if (ids.length < 2) return NextResponse.json({ error: "至少 2 個 tag 才合併" }, { status: 400 });

  // 找/建目標 tag
  const targetSlug = slugify(targetName);
  const target = await db.tag.upsert({
    where: { name: targetName },
    create: { name: targetName, slug: targetSlug },
    update: {},
  });

  // 把其他 tag 的所有 PostTag 關聯改指 target，再刪掉舊 tag
  const otherIds = ids.filter((id) => id !== target.id);
  if (otherIds.length === 0) {
    return NextResponse.json({ error: "選擇的 tag 都是目標本身" }, { status: 400 });
  }

  let mergedPostCount = 0;
  for (const oldId of otherIds) {
    // 把舊 tag 的所有 PostTag 連結指到 target，但避免衝突 unique（postId+tagId）
    const oldRels = await db.postTag.findMany({ where: { tagId: oldId }, select: { postId: true } });
    for (const rel of oldRels) {
      await db.postTag.upsert({
        where: { postId_tagId: { postId: rel.postId, tagId: target.id } },
        update: {},
        create: { postId: rel.postId, tagId: target.id },
      });
      mergedPostCount++;
    }
    await db.postTag.deleteMany({ where: { tagId: oldId } });
    await db.tag.delete({ where: { id: oldId } });
  }

  // 重算 target.postCount
  const newCount = await db.postTag.count({ where: { tagId: target.id } });
  await db.tag.update({ where: { id: target.id }, data: { postCount: newCount } });

  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "Tag", targetId: target.id,
    detail: `[TAG_MERGE] 合併 ${otherIds.length} 個進「${targetName}」（${mergedPostCount} 筆關聯）`,
  });

  revalidatePath("/admin/tags");
  revalidatePath("/search");

  return NextResponse.json({ ok: true, target: target.name, postCount: newCount, merged: otherIds.length });
}

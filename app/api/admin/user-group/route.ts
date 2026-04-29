import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GROUPS, getGroupConfig } from "@/lib/user-groups";
import type { UserGroup } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "需要管理員權限" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? "");
  const group = body.group as UserGroup;
  if (!userId || !group) {
    return NextResponse.json({ success: false, error: "缺少參數" }, { status: 400 });
  }
  if (!GROUPS.some((g) => g.group === group)) {
    return NextResponse.json({ success: false, error: "無效的群組" }, { status: 400 });
  }

  const cfg = getGroupConfig(group);
  await db.user.update({
    where: { id: userId },
    data: { userGroup: group, readPermission: cfg.readPower },
  });
  await db.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "LEVEL_ADJUST",
      targetType: "user",
      targetId: userId,
      detail: `Set group to ${group} (readPower=${cfg.readPower})`,
    },
  });
  return NextResponse.json({ success: true, group, readPower: cfg.readPower });
}

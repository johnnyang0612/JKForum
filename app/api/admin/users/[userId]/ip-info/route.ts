/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "需要管理員權限" }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      username: true,
      registerIp: true,
      lastLoginIp: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "用戶不存在" }, { status: 404 });
  }

  // 共用 IP 的其他帳號（防小號）
  const ipsToCheck = [user.registerIp, user.lastLoginIp].filter((x): x is string => !!x);
  const sharedIpUsers: Array<{ id: string; username: string; sharedIp: string; via: string }> = [];
  if (ipsToCheck.length > 0) {
    const others = await db.user.findMany({
      where: {
        id: { not: params.userId },
        OR: [
          { registerIp: { in: ipsToCheck } },
          { lastLoginIp: { in: ipsToCheck } },
        ],
      },
      select: {
        id: true,
        username: true,
        registerIp: true,
        lastLoginIp: true,
      },
      take: 30,
    });
    for (const o of others) {
      if (o.registerIp && ipsToCheck.includes(o.registerIp)) {
        sharedIpUsers.push({ id: o.id, username: o.username, sharedIp: o.registerIp, via: "registerIp" });
      }
      if (o.lastLoginIp && ipsToCheck.includes(o.lastLoginIp)) {
        sharedIpUsers.push({ id: o.id, username: o.username, sharedIp: o.lastLoginIp, via: "lastLoginIp" });
      }
    }
  }

  // 從 admin_logs 抓近 20 筆該 admin 的操作 IP（如有 ipAddress）
  const recentIps = await db.adminLog.findMany({
    where: { adminId: params.userId, ipAddress: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { ipAddress: true, createdAt: true, action: true },
  });

  return NextResponse.json({
    success: true,
    user,
    sharedIpUsers,
    sharedIpCount: sharedIpUsers.length,
    recentIps,
  });
}

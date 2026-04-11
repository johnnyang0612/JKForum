import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      points: true,
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "用戶不存在" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      profile: user.profile,
      points: user.points,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }

  const body = await req.json();

  // Handle password change
  if (body.newPassword) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true },
    });

    if (!user?.hashedPassword) {
      return NextResponse.json({ success: false, error: "此帳號不支援密碼修改" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(body.currentPassword, user.hashedPassword);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "目前密碼不正確" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.newPassword, 12);
    await db.user.update({
      where: { id: session.user.id },
      data: { hashedPassword },
    });

    return NextResponse.json({ success: true });
  }

  // Handle profile update
  const updateData: Record<string, unknown> = {};
  const profileData: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    updateData.displayName = body.displayName;
  }

  if (body.bio !== undefined) profileData.bio = body.bio;
  if (body.signature !== undefined) profileData.signature = body.signature;
  if (body.website !== undefined) profileData.website = body.website || null;
  if (body.location !== undefined) profileData.location = body.location;
  if (body.isPublic !== undefined) profileData.isPublic = body.isPublic;

  try {
    if (Object.keys(updateData).length > 0) {
      await db.user.update({
        where: { id: session.user.id },
        data: updateData,
      });
    }

    if (Object.keys(profileData).length > 0) {
      await db.userProfile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, ...profileData },
        update: profileData,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "更新失敗" }, { status: 500 });
  }
}

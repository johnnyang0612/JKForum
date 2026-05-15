import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** mini 用戶卡資訊（hover card 用） */
export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      userGroup: true,
      userType: true,
      merchantVerified: true,
      merchantName: true,
      createdAt: true,
      profile: { select: { avatarUrl: true, bio: true, postCount: true, replyCount: true, likeCount: true, followerCount: true } },
    },
  });
  if (!user) return NextResponse.json({ success: false, error: "not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      merchantName: user.merchantName,
      avatarUrl: user.profile?.avatarUrl ?? null,
      bio: user.profile?.bio ?? null,
      group: user.userGroup,
      type: user.userType,
      merchantVerified: user.merchantVerified,
      joinedAt: user.createdAt,
      stats: {
        posts: user.profile?.postCount ?? 0,
        replies: user.profile?.replyCount ?? 0,
        likes: user.profile?.likeCount ?? 0,
        followers: user.profile?.followerCount ?? 0,
      },
    },
  });
}

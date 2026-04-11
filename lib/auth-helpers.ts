import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

/**
 * 取得當前用戶 Session（Server Component / Route Handler 用）
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      points: true,
    },
  });

  return user;
}

/**
 * 強制要求登入，否則重導向到登入頁
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/**
 * 強制要求管理員權限
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/");
  }
  return user;
}

/**
 * 強制要求版主以上權限
 */
export async function requireModerator(forumId: string) {
  const user = await requireAuth();

  // 管理員自動擁有版主權限
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return user;
  }

  const isMod = await db.forumModerator.findUnique({
    where: {
      forumId_userId: { forumId, userId: user.id },
    },
  });

  if (!isMod) {
    redirect("/");
  }

  return user;
}

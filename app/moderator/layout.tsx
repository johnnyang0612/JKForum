import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ModeratorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // 允許進入：admin、super_admin，或任一版主
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  let modCount = 0;
  if (!isAdmin) {
    modCount = await db.forumModerator.count({ where: { userId: session.user.id } });
    if (modCount === 0) redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card safe-area-pt">
        <div className="flex h-14 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/moderator" className="truncate text-base font-bold text-primary sm:text-lg">
              🛡️ 版務後台
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {isAdmin && (
              <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                完整後台
              </Link>
            )}
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              返回前台
            </Link>
          </div>
        </div>
      </header>
      <main className="container-main p-3 pb-20 sm:p-6">{children}</main>
    </div>
  );
}

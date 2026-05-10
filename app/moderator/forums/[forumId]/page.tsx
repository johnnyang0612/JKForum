import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ModeratorForumForm } from "@/components/moderator/moderator-forum-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "版務設定" };

export default async function ModeratorForumPage({ params }: { params: { forumId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  const isMod = !isAdmin && (await db.forumModerator.findUnique({
    where: { forumId_userId: { forumId: params.forumId, userId: session.user.id } },
  }));
  if (!isAdmin && !isMod) redirect("/moderator");

  const forum = await db.forum.findUnique({
    where: { id: params.forumId },
    include: { category: { select: { name: true } } },
  });
  if (!forum) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/moderator" className="text-xs text-muted-foreground hover:text-primary">
          ← 版務後台
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{forum.name}</h1>
        <p className="text-sm text-muted-foreground">
          {forum.category?.name} · {forum.postCount.toLocaleString()} 篇文章
        </p>
      </div>

      <ModeratorForumForm
        forumId={forum.id}
        initial={{
          rules: forum.rules ?? "",
          isLocked: forum.isLocked,
          maxPinnedPosts: forum.maxPinnedPosts,
          advancedFiltersJson: JSON.stringify(forum.advancedFiltersJson ?? [], null, 2),
          themeCategoriesJson: Array.isArray(forum.themeCategoriesJson)
            ? (forum.themeCategoriesJson as string[]).join(", ")
            : "",
          forceThemeCategory: forum.forceThemeCategory,
        }}
      />
    </div>
  );
}

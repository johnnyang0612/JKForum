import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostEditor } from "@/components/post/post-editor";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "發表新文章",
};

interface Props {
  searchParams: { forumId?: string };
}

export default async function NewPostPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/posts/new");
  }

  const forums = await db.forum.findMany({
    where: { isVisible: true, isLocked: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, advancedFiltersJson: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">發表新文章</h1>
        <p className="mt-1 text-muted-foreground">分享你的想法與大家討論</p>
      </div>
      <PostEditor
        forums={forums}
        defaultForumId={searchParams.forumId}
      />
    </div>
  );
}

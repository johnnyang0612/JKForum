import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostEditor } from "@/components/post/post-editor";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "編輯文章",
};

interface Props {
  params: { postId: string };
}

export default async function EditPostPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const post = await db.post.findUnique({
    where: { id: params.postId },
    include: {
      tags: { include: { tag: true } },
    },
  });

  if (!post || post.status === "DELETED") {
    notFound();
  }

  // Check ownership
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const forums = await db.forum.findMany({
    where: { isVisible: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, advancedFiltersJson: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">編輯文章</h1>
        <p className="mt-1 text-muted-foreground">修改你的文章內容</p>
      </div>
      <PostEditor
        forums={forums}
        initialData={{
          id: post.id,
          title: post.title,
          content: post.content,
          forumId: post.forumId,
          visibility: post.visibility,
          tags: post.tags.map((t) => t.tag.name),
          advancedAttrs: (post.advancedAttrs as Record<string, unknown>) ?? {},
        }}
      />
    </div>
  );
}

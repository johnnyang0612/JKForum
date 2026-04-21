import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { ForumList } from "@/components/forum/forum-list";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: { categorySlug: string };
}

const getCategory = cache(async (slug: string) => {
  return db.category.findUnique({
    where: { slug },
    include: {
      forums: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(params.categorySlug);
  if (!category) return { title: "分類不存在" };
  return {
    title: category.name,
    description: category.description || `${category.name} - 看板分類`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await getCategory(params.categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/forums" className="hover:text-foreground transition-colors">
          看板列表
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Forums */}
      <ForumList
        forums={category.forums.map((f) => ({
          ...f,
          category: { slug: category.slug },
        }))}
      />
    </div>
  );
}

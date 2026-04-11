import { db } from "@/lib/db";
import { SearchBar } from "@/components/search/search-bar";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchResults } from "@/components/search/search-results";
import { Pagination } from "@/components/shared/pagination";
import { SITE_CONFIG } from "@/lib/constants/config";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "搜尋" };

interface Props {
  searchParams: { q?: string; type?: string; page?: string };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q?.trim() || "";
  const type = searchParams.type || "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = SITE_CONFIG.searchResultsPerPage;

  const results: Array<{
    type: "post" | "user" | "forum";
    id: string;
    title: string;
    excerpt?: string;
    url: string;
    createdAt?: Date;
  }> = [];
  let total = 0;

  if (query) {
    if (!type || type === "post") {
      const [posts, postCount] = await Promise.all([
        db.post.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "desc" },
          skip: type === "post" ? (page - 1) * limit : 0,
          take: type === "post" ? limit : 10,
          select: { id: true, title: true, excerpt: true, createdAt: true },
        }),
        type === "post"
          ? db.post.count({
              where: {
                status: "PUBLISHED",
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { content: { contains: query, mode: "insensitive" } },
                ],
              },
            })
          : Promise.resolve(0),
      ]);

      results.push(
        ...posts.map((p) => ({
          type: "post" as const,
          id: p.id,
          title: p.title,
          excerpt: p.excerpt || undefined,
          url: `/posts/${p.id}`,
          createdAt: p.createdAt,
        }))
      );
      if (type === "post") total = postCount;
    }

    if (!type || type === "user") {
      const [users, userCount] = await Promise.all([
        db.user.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { displayName: { contains: query, mode: "insensitive" } },
            ],
          },
          skip: type === "user" ? (page - 1) * limit : 0,
          take: type === "user" ? limit : 5,
          select: { id: true, username: true, displayName: true },
        }),
        type === "user"
          ? db.user.count({
              where: {
                status: "ACTIVE",
                OR: [
                  { username: { contains: query, mode: "insensitive" } },
                  { displayName: { contains: query, mode: "insensitive" } },
                ],
              },
            })
          : Promise.resolve(0),
      ]);

      results.push(
        ...users.map((u) => ({
          type: "user" as const,
          id: u.id,
          title: u.displayName,
          excerpt: `@${u.username}`,
          url: `/profile/${u.id}`,
        }))
      );
      if (type === "user") total = userCount;
    }

    if (!type || type === "forum") {
      const [forums, forumCount] = await Promise.all([
        db.forum.findMany({
          where: {
            isVisible: true,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          skip: type === "forum" ? (page - 1) * limit : 0,
          take: type === "forum" ? limit : 5,
          select: { id: true, name: true, description: true, slug: true, category: { select: { slug: true } } },
        }),
        type === "forum"
          ? db.forum.count({
              where: {
                isVisible: true,
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
            })
          : Promise.resolve(0),
      ]);

      results.push(
        ...forums.map((f) => ({
          type: "forum" as const,
          id: f.id,
          title: f.name,
          excerpt: f.description || undefined,
          url: `/forums/${f.category.slug}/${f.slug}`,
        }))
      );
      if (type === "forum") total = forumCount;
    }
  }

  const totalPages = type ? Math.ceil(total / limit) : 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">搜尋</h1>
      <SearchBar defaultValue={query} />
      {query && <SearchFilters />}
      {query ? (
        <>
          <p className="text-sm text-muted-foreground">
            搜尋「{query}」的結果
            {type && total > 0 && `（共 ${total} 筆）`}
          </p>
          <SearchResults results={results} query={query} />
          {type && <Pagination currentPage={page} totalPages={totalPages} />}
        </>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          輸入關鍵字開始搜尋
        </div>
      )}
    </div>
  );
}

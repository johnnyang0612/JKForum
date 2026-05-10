/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPassedAgeGate, isR18Enabled } from "@/lib/age-gate";
import { SearchBar } from "@/components/search/search-bar";
import { SearchFilters } from "@/components/search/search-filters";
import { SITE_CONFIG } from "@/lib/constants/config";
import { formatNumber, timeAgo } from "@/lib/utils/format";
import { FileText, User, Hash, BookOpen, Award, Lock } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "搜尋" };

interface Props {
  searchParams: { q?: string; type?: string; page?: string; r18?: string; tag?: string };
}

const TYPES = [
  { key: "all", label: "全部", icon: null },
  { key: "post", label: "文章", icon: FileText },
  { key: "user", label: "用戶", icon: User },
  { key: "forum", label: "看板", icon: Hash },
  { key: "blog", label: "日誌", icon: BookOpen },
  { key: "medal", label: "勳章", icon: Award },
] as const;

function highlight(text: string, query: string) {
  if (!query) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${safe})`, "gi"),
    '<mark class="bg-yellow-300/40 text-foreground rounded px-0.5">$1</mark>'
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q?.trim() || "";
  const type = searchParams.type || "all";
  const tagFilter = searchParams.tag?.trim() || "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = SITE_CONFIG.searchResultsPerPage ?? 20;
  const includeR18 = searchParams.r18 === "1";

  // tag filter：找出該 tag 的所有 postIds
  let tagPostIds: string[] | null = null;
  let resolvedTag: { id: string; name: string; postCount: number } | null = null;
  if (tagFilter) {
    const tag = await db.tag.findFirst({
      where: { OR: [{ name: tagFilter }, { slug: tagFilter }] },
      select: { id: true, name: true, postCount: true },
    });
    if (tag) {
      resolvedTag = tag;
      const rels = await db.postTag.findMany({
        where: { tagId: tag.id },
        select: { postId: true },
        take: 200,
      });
      tagPostIds = rels.map((r) => r.postId);
    }
  }

  // 是否能看 R-18：平台開、用戶通過 age gate、用戶勾選
  const session = await getServerSession(authOptions);
  const r18Enabled = await isR18Enabled();
  const passedGate = await hasPassedAgeGate(session?.user?.id);
  const canSeeR18 = r18Enabled && passedGate && includeR18;

  // 統一 R-18 過濾條件
  const ratingFilter = canSeeR18 ? {} : { rating: { not: "R18" as const } };

  let postCount = 0,
    userCount = 0,
    forumCount = 0,
    blogCount = 0,
    medalCount = 0;
  let posts: any[] = [], users: any[] = [], forums: any[] = [], blogs: any[] = [], medals: any[] = [];

  if (query || tagFilter) {
    const isAll = type === "all";
    const ipage = isAll ? 1 : page;
    const iLimit = isAll ? 5 : limit;
    const iSkip = (ipage - 1) * iLimit;

    // 構建 post where（含 tag 過濾）
    const postWhere: Record<string, unknown> = {
      status: "PUBLISHED",
      ...ratingFilter,
    };
    if (query) {
      postWhere.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ];
    }
    if (tagPostIds !== null) {
      postWhere.id = { in: tagPostIds };
    }

    [posts, postCount, users, userCount, forums, forumCount, blogs, blogCount, medals, medalCount] =
      await Promise.all([
        type === "user" || type === "forum" || type === "blog" || type === "medal"
          ? Promise.resolve([])
          : db.post.findMany({
              where: postWhere,
              orderBy: { likeCount: "desc" },
              skip: type === "post" ? iSkip : 0,
              take: iLimit,
              include: {
                author: { select: { id: true, displayName: true, username: true } },
                forum: { select: { name: true, slug: true, category: { select: { slug: true } } } },
              },
            }),
        type === "post"
          ? db.post.count({ where: postWhere })
          : Promise.resolve(0),
        type === "post" || type === "forum" || type === "blog" || type === "medal"
          ? Promise.resolve([])
          : db.user.findMany({
              where: {
                status: "ACTIVE",
                OR: [
                  { username: { contains: query, mode: "insensitive" } },
                  { displayName: { contains: query, mode: "insensitive" } },
                ],
              },
              skip: type === "user" ? iSkip : 0,
              take: iLimit,
              select: {
                id: true,
                username: true,
                displayName: true,
                userGroup: true,
                profile: { select: { bio: true, avatarUrl: true } },
              },
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
        type === "post" || type === "user" || type === "blog" || type === "medal"
          ? Promise.resolve([])
          : db.forum.findMany({
              where: {
                isVisible: true,
                ...ratingFilter,
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
              skip: type === "forum" ? iSkip : 0,
              take: iLimit,
              select: {
                id: true,
                name: true,
                description: true,
                slug: true,
                postCount: true,
                rating: true,
                category: { select: { slug: true } },
              },
            }),
        type === "forum"
          ? db.forum.count({
              where: {
                isVisible: true,
                ...ratingFilter,
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
            })
          : Promise.resolve(0),
        type === "post" || type === "user" || type === "forum" || type === "medal"
          ? Promise.resolve([])
          : db.blog.findMany({
              where: {
                isPublic: true,
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { content: { contains: query, mode: "insensitive" } },
                ],
              },
              skip: type === "blog" ? iSkip : 0,
              take: iLimit,
              include: {
                author: { select: { id: true, displayName: true, username: true } },
              },
            }),
        type === "blog"
          ? db.blog.count({
              where: {
                isPublic: true,
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { content: { contains: query, mode: "insensitive" } },
                ],
              },
            })
          : Promise.resolve(0),
        type === "post" || type === "user" || type === "forum" || type === "blog"
          ? Promise.resolve([])
          : db.medal.findMany({
              where: {
                isActive: true,
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
              skip: type === "medal" ? iSkip : 0,
              take: iLimit,
            }),
        type === "medal"
          ? db.medal.count({
              where: {
                isActive: true,
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
            })
          : Promise.resolve(0),
      ]);
  }

  const totalCounts = {
    post: postCount || posts.length,
    user: userCount || users.length,
    forum: forumCount || forums.length,
    blog: blogCount || blogs.length,
    medal: medalCount || medals.length,
  };
  const allCount = totalCounts.post + totalCounts.user + totalCounts.forum + totalCounts.blog + totalCounts.medal;
  const total = type === "all" ? allCount : totalCounts[type as keyof typeof totalCounts] ?? 0;
  const totalPages = type === "all" ? 1 : Math.max(1, Math.ceil(total / limit));

  function tabHref(t: string) {
    const params = new URLSearchParams();
    params.set("q", query);
    if (t !== "all") params.set("type", t);
    if (includeR18) params.set("r18", "1");
    return `/search?${params}`;
  }

  // R18 toggle URL（只在平台已開啟 R18 且使用者通過 gate 時才顯示）
  const r18ToggleVisible = r18Enabled && passedGate;
  const r18ToggleNext = includeR18
    ? `/search?${new URLSearchParams({ ...searchParams as Record<string, string>, r18: "" }).toString().replace(/&?r18=/, "")}`
    : `/search?${new URLSearchParams({ ...searchParams as Record<string, string>, r18: "1" }).toString()}`;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold">搜尋</h1>
      <SearchBar defaultValue={query} />

      {/* R18 toggle */}
      {r18ToggleVisible && (
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
          <span className="font-medium">🔞</span>
          <span className="text-muted-foreground">R-18 內容</span>
          <Link
            href={r18ToggleNext}
            className={`ml-auto inline-flex tap-target items-center gap-1 rounded-full border px-3 text-xs transition-colors ${
              includeR18
                ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                : "hover:bg-muted"
            }`}
          >
            {includeR18 ? "✓ 已顯示" : "顯示"}
          </Link>
        </div>
      )}
      {r18Enabled && !passedGate && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-dashed bg-card px-3 py-2 text-xs">
          <span className="text-muted-foreground">🔞 想看 R-18 結果？請先通過年齡確認</span>
          <Link href="/age-gate?next=/search" className="text-primary hover:underline">前往</Link>
        </div>
      )}

      {tagFilter && (
        <div className="flex items-center gap-2 rounded-md border bg-primary/5 px-3 py-2 text-sm">
          <span className="text-muted-foreground">篩選標籤：</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
            #{resolvedTag?.name ?? tagFilter}
          </span>
          {resolvedTag && (
            <span className="text-xs text-muted-foreground">{resolvedTag.postCount} 篇文章</span>
          )}
          <Link
            href={`/search?${new URLSearchParams({ ...searchParams, tag: "" }).toString().replace(/&?tag=/, "")}`}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            清除標籤
          </Link>
        </div>
      )}

      {(query || tagFilter) && (
        <>
          {/* 類型 tabs */}
          <div className="flex gap-1 overflow-x-auto border-b">
            {TYPES.map((t) => {
              const c = (totalCounts[t.key as keyof typeof totalCounts] as number) ?? 0;
              const active = (type ?? "all") === t.key || (t.key === "all" && type === "all");
              const showCount = t.key !== "all";
              return (
                <Link
                  key={t.key}
                  href={tabHref(t.key)}
                  className={`flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm transition ${
                    active
                      ? "border-b-2 border-primary font-bold text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.icon && <t.icon className="h-3.5 w-3.5" />}
                  {t.label}
                  {showCount && c > 0 && (
                    <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{c}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* R-18 toggle */}
          {r18Enabled && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
              <Lock className="h-4 w-4 text-amber-400" />
              {!passedGate ? (
                <span className="text-muted-foreground">
                  R-18 內容已過濾。
                  <Link
                    href={`/age-gate?next=/search?q=${encodeURIComponent(query)}`}
                    className="ml-1 text-primary hover:underline"
                  >
                    通過年齡驗證
                  </Link>{" "}
                  以包含成人內容。
                </span>
              ) : (
                <Link
                  href={includeR18 ? tabHref(type).replace(/&r18=1$/, "").replace("?r18=1&", "?").replace("?r18=1", "") : `${tabHref(type)}&r18=1`}
                  className="text-primary hover:underline"
                >
                  {includeR18 ? "🔓 已包含 R-18 內容（點此關閉）" : "🔒 點此包含 R-18 內容"}
                </Link>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            搜尋「<b className="text-foreground">{query}</b>」共找到 {allCount} 筆結果
          </p>

          {/* All 模式：分區塊顯示前 5 筆 */}
          {type === "all" && (
            <>
              {posts.length > 0 && (
                <ResultSection
                  icon={<FileText className="h-5 w-5 text-orange-500" />}
                  title="文章"
                  count={posts.length}
                  more={tabHref("post")}
                >
                  {posts.map((p) => (
                    <PostResult key={p.id} post={p} query={query} />
                  ))}
                </ResultSection>
              )}
              {users.length > 0 && (
                <ResultSection
                  icon={<User className="h-5 w-5 text-blue-500" />}
                  title="用戶"
                  count={users.length}
                  more={tabHref("user")}
                >
                  {users.map((u) => (
                    <UserResult key={u.id} user={u} query={query} />
                  ))}
                </ResultSection>
              )}
              {forums.length > 0 && (
                <ResultSection
                  icon={<Hash className="h-5 w-5 text-emerald-500" />}
                  title="看板"
                  count={forums.length}
                  more={tabHref("forum")}
                >
                  {forums.map((f) => (
                    <ForumResult key={f.id} forum={f} query={query} />
                  ))}
                </ResultSection>
              )}
              {blogs.length > 0 && (
                <ResultSection
                  icon={<BookOpen className="h-5 w-5 text-indigo-500" />}
                  title="日誌"
                  count={blogs.length}
                  more={tabHref("blog")}
                >
                  {blogs.map((b) => (
                    <BlogResult key={b.id} blog={b} query={query} />
                  ))}
                </ResultSection>
              )}
              {medals.length > 0 && (
                <ResultSection
                  icon={<Award className="h-5 w-5 text-amber-500" />}
                  title="勳章"
                  count={medals.length}
                >
                  {medals.map((m) => (
                    <MedalResult key={m.id} medal={m} query={query} />
                  ))}
                </ResultSection>
              )}
              {allCount === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  沒有符合「{query}」的結果，試試其他關鍵字
                </div>
              )}
            </>
          )}

          {/* 單類型模式 */}
          {type === "post" &&
            posts.map((p) => <PostResult key={p.id} post={p} query={query} />)}
          {type === "user" &&
            users.map((u) => <UserResult key={u.id} user={u} query={query} />)}
          {type === "forum" &&
            forums.map((f) => <ForumResult key={f.id} forum={f} query={query} />)}
          {type === "blog" &&
            blogs.map((b) => <BlogResult key={b.id} blog={b} query={query} />)}
          {type === "medal" &&
            medals.map((m) => <MedalResult key={m.id} medal={m} query={query} />)}
        </>
      )}

      {!query && !tagFilter && (
        <div className="py-16 text-center text-muted-foreground">
          輸入關鍵字開始搜尋
        </div>
      )}
    </div>
  );
}

function ResultSection({
  icon,
  title,
  count,
  more,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  more?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          {icon}
          {title} <span className="text-xs text-muted-foreground">({count})</span>
        </h2>
        {more && (
          <Link href={more} className="text-xs text-muted-foreground hover:text-primary">
            看更多 →
          </Link>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function PostResult({ post, query }: { post: any; query: string }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="block rounded-lg border bg-card p-3 transition hover:border-primary/40"
    >
      <h3
        className="font-bold"
        dangerouslySetInnerHTML={{ __html: highlight(post.title, query) }}
      />
      {post.excerpt && (
        <p
          className="mt-1 line-clamp-2 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: highlight(post.excerpt, query) }}
        />
      )}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>@{post.author?.displayName ?? "—"}</span>
        <span>·</span>
        <span>{post.forum?.name}</span>
        <span>·</span>
        <span>{formatNumber(post.viewCount ?? 0)} 閱讀</span>
        <span>·</span>
        <span>{post.createdAt && timeAgo(post.createdAt)}</span>
      </div>
    </Link>
  );
}

function UserResult({ user, query }: { user: any; query: string }) {
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-primary/40"
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {user.displayName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="font-bold"
          dangerouslySetInnerHTML={{ __html: highlight(user.displayName, query) }}
        />
        <div
          className="text-xs text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: `@${highlight(user.username, query)} · ${user.userGroup}` }}
        />
        {user.profile?.bio && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {user.profile.bio}
          </p>
        )}
      </div>
    </Link>
  );
}

function ForumResult({ forum, query }: { forum: any; query: string }) {
  return (
    <Link
      href={`/forums/${forum.category.slug}/${forum.slug}`}
      className="block rounded-lg border bg-card p-3 transition hover:border-primary/40"
    >
      <h3 className="flex items-center gap-2 font-bold">
        <Hash className="h-4 w-4" />
        <span dangerouslySetInnerHTML={{ __html: highlight(forum.name, query) }} />
        {forum.rating === "R18" && (
          <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-400">
            18+
          </span>
        )}
      </h3>
      {forum.description && (
        <p
          className="mt-1 line-clamp-2 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: highlight(forum.description, query) }}
        />
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {formatNumber(forum.postCount ?? 0)} 篇文章
      </p>
    </Link>
  );
}

function BlogResult({ blog, query }: { blog: any; query: string }) {
  const plain = blog.content.replace(/<[^>]*>/g, "").slice(0, 200);
  return (
    <Link
      href={`/blog/${blog.id}`}
      className="block rounded-lg border bg-card p-3 transition hover:border-primary/40"
    >
      <h3
        className="flex items-center gap-2 font-bold"
        dangerouslySetInnerHTML={{ __html: `<svg class="h-4 w-4 inline"></svg>${highlight(blog.title, query)}` }}
      />
      <p
        className="mt-1 line-clamp-2 text-sm text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: highlight(plain, query) }}
      />
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>@{blog.author?.displayName ?? "—"}</span>
        <span>·</span>
        <span>{formatNumber(blog.viewCount ?? 0)} 閱讀</span>
        <span>·</span>
        <span>{timeAgo(blog.createdAt)}</span>
      </div>
    </Link>
  );
}

function MedalResult({ medal, query }: { medal: any; query: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <span className="text-3xl">{medal.iconEmoji ?? "🏅"}</span>
      <div className="flex-1">
        <h3
          className="font-bold"
          dangerouslySetInnerHTML={{ __html: highlight(medal.name, query) }}
        />
        {medal.description && (
          <p
            className="mt-1 text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: highlight(medal.description, query) }}
          />
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {medal.tier} · {medal.category}
        </p>
      </div>
    </div>
  );
}

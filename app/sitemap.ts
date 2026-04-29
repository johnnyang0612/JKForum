import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://jkforum.vercel.app"
).trim().replace(/\/$/, "");

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/forums`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/hot`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/latest`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
  ];

  try {
    const [categories, forums, posts, blogs, users] = await Promise.all([
      db.category.findMany({
        where: { isVisible: true, rating: { not: "R18" } },
        select: { slug: true, updatedAt: true },
      }),
      db.forum.findMany({
        where: { isVisible: true, rating: { not: "R18" } },
        select: {
          slug: true,
          updatedAt: true,
          category: { select: { slug: true } },
        },
      }),
      db.post.findMany({
        where: { status: "PUBLISHED", rating: { not: "R18" } },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
      db.blog.findMany({
        where: { isPublic: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1000,
      }),
      db.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 2000,
      }),
    ]);

    const categoryUrls = categories.map((c) => ({
      url: `${SITE_URL}/forums/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
    const forumUrls = forums.map((f) => ({
      url: `${SITE_URL}/forums/${f.category.slug}/${f.slug}`,
      lastModified: f.updatedAt,
      changeFrequency: "hourly" as const,
      priority: 0.6,
    }));
    const postUrls = posts.map((p) => ({
      url: `${SITE_URL}/posts/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
    const blogUrls = blogs.map((b) => ({
      url: `${SITE_URL}/blog/${b.id}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));
    const userUrls = users.map((u) => ({
      url: `${SITE_URL}/profile/${u.id}`,
      lastModified: u.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.3,
    }));

    return [
      ...staticUrls,
      ...categoryUrls,
      ...forumUrls,
      ...postUrls,
      ...blogUrls,
      ...userUrls,
    ];
  } catch {
    return staticUrls;
  }
}

import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const SITE = "JKForum";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "site";  // site | post | blog | profile | forum
  const id = url.searchParams.get("id");

  let title = SITE;
  let subtitle = "綜合型社群論壇平台";
  let badge = "";

  try {
    if (type === "post" && id) {
      const p = await db.post.findUnique({
        where: { id },
        select: {
          title: true,
          forum: { select: { name: true } },
          author: { select: { displayName: true } },
        },
      });
      if (p) {
        title = p.title;
        subtitle = `${p.forum.name} · @${p.author.displayName}`;
        badge = "📰 文章";
      }
    } else if (type === "blog" && id) {
      const b = await db.blog.findUnique({
        where: { id },
        select: { title: true, author: { select: { displayName: true } } },
      });
      if (b) {
        title = b.title;
        subtitle = `個人日誌 · @${b.author.displayName}`;
        badge = "📓 Blog";
      }
    } else if (type === "profile" && id) {
      const u = await db.user.findUnique({
        where: { id },
        select: {
          displayName: true,
          username: true,
          userGroup: true,
          profile: { select: { bio: true } },
        },
      });
      if (u) {
        title = u.displayName;
        subtitle = u.profile?.bio ?? `@${u.username}`;
        badge = "👤 個人空間";
      }
    } else if (type === "forum" && id) {
      const f = await db.forum.findUnique({
        where: { slug: id },
        select: { name: true, description: true, postCount: true },
      });
      if (f) {
        title = f.name;
        subtitle = f.description ?? `${f.postCount} 篇文章`;
        badge = "📂 看板";
      }
    } else {
      title = url.searchParams.get("title") ?? SITE;
      subtitle = url.searchParams.get("subtitle") ?? subtitle;
      badge = url.searchParams.get("badge") ?? "";
    }
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #6d28d9 100%)",
          padding: "60px",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: 0.9,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              background: "linear-gradient(90deg, #f59e0b, #ec4899)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            JKForum
          </div>
          {badge && (
            <span
              style={{
                fontSize: 18,
                background: "rgba(255,255,255,0.15)",
                padding: "6px 14px",
                borderRadius: 999,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: title.length > 30 ? 48 : 64,
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              opacity: 0.8,
              maxWidth: 1000,
            }}
          >
            {subtitle}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: 0.6,
            fontSize: 18,
          }}
        >
          <span>jkforum.vercel.app</span>
          <span>綜合型社群論壇</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

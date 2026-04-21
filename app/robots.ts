import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://jkforum.vercel.app"
).trim().replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/forums", "/posts", "/search"],
        disallow: [
          "/api/",
          "/admin/",
          "/settings/",
          "/messages/",
          "/notifications/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

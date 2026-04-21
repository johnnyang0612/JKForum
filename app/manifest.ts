import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JKForum - 綜合型社群論壇平台",
    short_name: "JKForum",
    description: "分享、討論、交流 — 綜合型社群論壇平台",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    lang: "zh-TW",
    icons: [
      {
        src: "/icons/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "熱門文章",
        short_name: "熱門",
        url: "/hot",
        icons: [{ src: "/icons/icon-192", sizes: "192x192" }],
      },
      {
        name: "發表新文章",
        short_name: "發文",
        url: "/posts/new",
        icons: [{ src: "/icons/icon-192", sizes: "192x192" }],
      },
      {
        name: "私訊",
        short_name: "私訊",
        url: "/messages",
        icons: [{ src: "/icons/icon-192", sizes: "192x192" }],
      },
    ],
    categories: ["social", "news", "entertainment"],
  };
}

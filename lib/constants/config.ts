export const SITE_CONFIG = {
  name: "JKForum",
  description: "綜合型社群論壇平台",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // 分頁
  postsPerPage: 20,
  repliesPerPage: 30,
  notificationsPerPage: 20,
  usersPerPage: 20,
  searchResultsPerPage: 20,

  // 上傳限制
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  maxAvatarSize: 2 * 1024 * 1024,  // 2MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] as string[],
  maxImagesPerPost: 20,

  // 內容限制
  maxTitleLength: 200,
  maxContentLength: 50000,
  maxReplyLength: 10000,
  maxSignatureLength: 200,
  maxBioLength: 500,
  maxUsernameLength: 30,
  minUsernameLength: 3,
  minPasswordLength: 8,

  // 回覆限制
  maxReplyNestingDepth: 2,

  // 標籤限制
  maxTagsPerPost: 5,

  // 速率限制（MVP 先用基本設定）
  maxPostsPerDay: 20,
  maxRepliesPerDay: 100,

  // SEO
  defaultOgImage: "/og-image.png",
} as const;

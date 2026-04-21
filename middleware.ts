import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // 管理後台：必須是 ADMIN 或 SUPER_ADMIN
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // 被封鎖的用戶：導向封鎖通知頁
    if (token?.status === "BANNED") {
      if (!pathname.startsWith("/banned") && !pathname.startsWith("/api/auth")) {
        return NextResponse.redirect(new URL("/banned", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // 公開頁面：不需要認證
        const publicPaths = [
          "/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/forums",
          "/posts",
          "/search",
          "/hot",
          "/latest",
          "/leaderboard",
          "/age-gate",
          "/team",
          "/faq",
          "/flink",
        ];

        // 公開路徑 + 其子路徑都允許匿名訪問
        const isPublic = publicPaths.some(
          (path) => pathname === path || pathname.startsWith(path + "/")
        );

        if (isPublic) return true;

        // API 路由中，GET 通常為公開（API 內部自行驗證）
        if (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin")) {
          return true;
        }

        // 其餘路徑需要登入
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|logo.svg|og-image.png|robots.txt|sitemap.xml|manifest.webmanifest|icons/|icon|apple-icon).*)",
  ],
};

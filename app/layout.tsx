import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "JKForum - 綜合型社群論壇平台",
    template: "%s | JKForum",
  },
  description: "JKForum 綜合型社群論壇平台 - 分享、討論、交流",
  keywords: ["論壇", "社群", "討論區", "JKForum"],
  authors: [{ name: "JKForum" }],
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "JKForum",
    title: "JKForum - 綜合型社群論壇平台",
    description: "JKForum 綜合型社群論壇平台 - 分享、討論、交流",
    images: [{ url: "/api/og?type=site", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JKForum - 綜合型社群論壇平台",
    description: "JKForum 綜合型社群論壇平台 - 分享、討論、交流",
    images: ["/api/og?type=site"],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: "JKForum",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            {children}
            <ToastProvider />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
